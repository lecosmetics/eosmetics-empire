/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — TYPES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/profil/profile-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * - profile-query.ts ;
 * - actions.ts ;
 * - ProfileClient.tsx ;
 * - page.tsx.
 *
 *
 * PRINCIPES :
 *
 * - aucune requête Prisma ;
 * - aucune lecture de session ;
 * - aucun secret ;
 * - aucun passwordHash ;
 * - aucune dépendance React ;
 * - aucune dépendance Next.js ;
 * - aucune donnée fictive ;
 * - aucune préférence de notification inventée ;
 * - aucune photo de profil inventée ;
 * - aucun prénom / nom inventé.
 *
 *
 * DONNÉES RÉELLES ACTUELLEMENT DISPONIBLES :
 *
 * Manager :
 *
 * - id ;
 * - email ;
 * - role ;
 * - status ;
 * - emailVerifiedAt ;
 * - lastLoginAt ;
 * - passwordChangedAt ;
 * - createdAt ;
 * - updatedAt.
 *
 * Store :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - city ;
 * - country ;
 * - address ;
 * - phone ;
 * - email ;
 * - status ;
 * - createdAt ;
 * - updatedAt.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS
   ========================================================================== */

export type GestionnaireProfileManagerId =
  string;


export type GestionnaireProfileStoreId =
  string;


/* ==========================================================================
   RÔLE GESTIONNAIRE
   ========================================================================== */

/**
 * Valeurs actuelles de ManagerRole.
 *
 * Le fichier n'importe volontairement pas Prisma afin de pouvoir
 * rester utilisable également par les composants client.
 */

export type GestionnaireProfileRole =
  | "OWNER"
  | "MANAGER"
  | "STAFF";


/* ==========================================================================
   STATUT GESTIONNAIRE
   ========================================================================== */

export type GestionnaireProfileManagerStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED";


/* ==========================================================================
   STATUT BOUTIQUE
   ========================================================================== */

export type GestionnaireProfileStoreStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED";


/* ==========================================================================
   DATE SÉRIALISÉE
   ========================================================================== */

/**
 * Les dates transmises à l'interface sont sérialisées en ISO.
 *
 * Exemple :
 *
 * 2026-09-21T14:32:00.000Z
 */

export type GestionnaireProfileIsoDate =
  string;


/* ==========================================================================
   MANAGER
   ========================================================================== */

/**
 * Informations sûres nécessaires à la page Profil.
 *
 * IMPORTANT :
 *
 * passwordHash ne doit jamais apparaître ici.
 */

export interface GestionnaireProfileManager {
  readonly id:
    GestionnaireProfileManagerId;


  readonly email:
    string;


  readonly role:
    GestionnaireProfileRole;


  readonly status:
    GestionnaireProfileManagerStatus;


  readonly emailVerifiedAt:
    GestionnaireProfileIsoDate | null;


  readonly lastLoginAt:
    GestionnaireProfileIsoDate | null;


  readonly passwordChangedAt:
    GestionnaireProfileIsoDate | null;


  readonly createdAt:
    GestionnaireProfileIsoDate;


  readonly updatedAt:
    GestionnaireProfileIsoDate;
}


/* ==========================================================================
   BOUTIQUE
   ========================================================================== */

export interface GestionnaireProfileStore {
  readonly id:
    GestionnaireProfileStoreId;


  readonly name:
    string;


  readonly slug:
    string;


  /**
   * Valeur enregistrée dans Store.country.
   *
   * Dans le flux d'inscription actuel il s'agit du code pays
   * normalisé en majuscules.
   */
  readonly country:
    string;


  readonly city:
    string;


  readonly address:
    string;


  readonly phone:
    string;


  readonly email:
    string;


  readonly status:
    GestionnaireProfileStoreStatus;


  readonly createdAt:
    GestionnaireProfileIsoDate;


  readonly updatedAt:
    GestionnaireProfileIsoDate;
}


/* ==========================================================================
   PAYS RÉSOLU
   ========================================================================== */

/**
 * Informations de présentation provenant du système pays existant.
 *
 * Elles sont résolues depuis :
 *
 * src/config/countries.ts
 *
 * On ne redéfinit aucune donnée supplémentaire ici.
 */

export interface GestionnaireProfileCountry {
  readonly code:
    string;

  readonly name:
    string;

  readonly dialCode:
    string;
}


/* ==========================================================================
   SÉCURITÉ
   ========================================================================== */

export interface GestionnaireProfileSecurity {
  /**
   * Dérivé de :
   *
   * manager.emailVerifiedAt !== null
   */
  readonly isEmailVerified:
    boolean;


  readonly emailVerifiedAt:
    GestionnaireProfileIsoDate | null;


  readonly lastLoginAt:
    GestionnaireProfileIsoDate | null;


  readonly passwordChangedAt:
    GestionnaireProfileIsoDate | null;
}


/* ==========================================================================
   VALEURS DU FORMULAIRE CONTACT
   ========================================================================== */

/**
 * Champs réellement modifiables dans cette première version.
 *
 * On ne modifie pas ici :
 *
 * - l'e-mail de connexion du Manager ;
 * - son rôle ;
 * - son statut ;
 * - le nom de la boutique ;
 * - l'e-mail de connexion.
 *
 * Ces changements nécessitent des flux métier séparés.
 */

export interface GestionnaireProfileContactValues {
  readonly phone:
    string;


  readonly country:
    string;


  readonly city:
    string;


  readonly address:
    string;
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

export interface GestionnaireProfilePageData {
  readonly manager:
    GestionnaireProfileManager;


  readonly store:
    GestionnaireProfileStore;


  /**
   * null uniquement si Store.country ne correspond à aucun pays
   * actuellement supporté par src/config/countries.ts.
   */
  readonly country:
    GestionnaireProfileCountry | null;


  readonly security:
    GestionnaireProfileSecurity;


  /**
   * Valeurs immédiatement utilisables pour initialiser le formulaire.
   */
  readonly contactValues:
    GestionnaireProfileContactValues;
}


/* ==========================================================================
   CONTACT — NOMS DES CHAMPS
   ========================================================================== */

export type GestionnaireProfileContactFieldName =
  | "phone"
  | "country"
  | "city"
  | "address";


/* ==========================================================================
   CONTACT — ERREURS PAR CHAMP
   ========================================================================== */

export type GestionnaireProfileContactFieldErrors =
  Partial<
    Record<
      GestionnaireProfileContactFieldName,
      string
    >
  >;


/* ==========================================================================
   CONTACT — CODES D'ERREUR
   ========================================================================== */

export type GestionnaireProfileContactErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "UNSUPPORTED_COUNTRY"
  | "INVALID_PHONE"
  | "STORE_NOT_FOUND"
  | "UPDATE_FAILED";


/* ==========================================================================
   ACTION STATUS
   ========================================================================== */

export type GestionnaireProfileActionStatus =
  | "idle"
  | "success"
  | "error";


/* ==========================================================================
   CONTACT — ACTION STATE
   ========================================================================== */

/**
 * Cet état peut être utilisé directement avec :
 *
 * useActionState(
 *   updateProfileContactAction,
 *   initialState,
 * )
 *
 * Les valeurs peuvent revenir au navigateur après une erreur car elles ne
 * contiennent aucune donnée sensible.
 */

export interface GestionnaireProfileContactActionState {
  readonly status:
    GestionnaireProfileActionStatus;


  readonly message:
    string | null;


  readonly code:
    GestionnaireProfileContactErrorCode | null;


  readonly fieldErrors:
    GestionnaireProfileContactFieldErrors;


  readonly values:
    GestionnaireProfileContactValues;
}


/* ==========================================================================
   CONTACT — INITIAL STATE
   ========================================================================== */

export const EMPTY_GESTIONNAIRE_PROFILE_CONTACT_VALUES:
  GestionnaireProfileContactValues = {
  phone:
    "",

  country:
    "",

  city:
    "",

  address:
    "",
};


export const INITIAL_GESTIONNAIRE_PROFILE_CONTACT_ACTION_STATE:
  GestionnaireProfileContactActionState = {
  status:
    "idle",

  message:
    null,

  code:
    null,

  fieldErrors:
    {},

  values:
    EMPTY_GESTIONNAIRE_PROFILE_CONTACT_VALUES,
};


/* ==========================================================================
   CONTACT — INITIAL STATE DEPUIS LES VRAIES DONNÉES
   ========================================================================== */

/**
 * Permet à ProfileClient.tsx de construire son initialState à partir
 * des données réellement chargées par profile-query.ts.
 */

export function createInitialGestionnaireProfileContactActionState(
  values:
    GestionnaireProfileContactValues,
): GestionnaireProfileContactActionState {
  return {
    status:
      "idle",

    message:
      null,

    code:
      null,

    fieldErrors:
      {},

    values: {
      phone:
        values.phone,

      country:
        values.country,

      city:
        values.city,

      address:
        values.address,
    },
  };
}


/* ==========================================================================
   MOT DE PASSE — NOMS DES CHAMPS
   ========================================================================== */

export type GestionnaireProfilePasswordFieldName =
  | "currentPassword"
  | "newPassword"
  | "newPasswordConfirmation";


/* ==========================================================================
   MOT DE PASSE — ERREURS PAR CHAMP
   ========================================================================== */

export type GestionnaireProfilePasswordFieldErrors =
  Partial<
    Record<
      GestionnaireProfilePasswordFieldName,
      string
    >
  >;


/* ==========================================================================
   MOT DE PASSE — CODES D'ERREUR
   ========================================================================== */

export type GestionnaireProfilePasswordErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "CURRENT_PASSWORD_INVALID"
  | "PASSWORD_TOO_WEAK"
  | "PASSWORD_MISMATCH"
  | "PASSWORD_UNCHANGED"
  | "MANAGER_NOT_FOUND"
  | "UPDATE_FAILED";


/* ==========================================================================
   MOT DE PASSE — ACTION STATE
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Aucun mot de passe n'est stocké dans cet état.
 *
 * Les valeurs suivantes ne doivent jamais être renvoyées au navigateur :
 *
 * - currentPassword ;
 * - newPassword ;
 * - newPasswordConfirmation ;
 * - passwordHash.
 */

export interface GestionnaireProfilePasswordActionState {
  readonly status:
    GestionnaireProfileActionStatus;


  readonly message:
    string | null;


  readonly code:
    GestionnaireProfilePasswordErrorCode | null;


  readonly fieldErrors:
    GestionnaireProfilePasswordFieldErrors;
}


/* ==========================================================================
   MOT DE PASSE — INITIAL STATE
   ========================================================================== */

export const INITIAL_GESTIONNAIRE_PROFILE_PASSWORD_ACTION_STATE:
  GestionnaireProfilePasswordActionState = {
  status:
    "idle",

  message:
    null,

  code:
    null,

  fieldErrors:
    {},
};


/* ==========================================================================
   LABEL RÔLE
   ========================================================================== */

export function getGestionnaireProfileRoleLabel(
  role:
    GestionnaireProfileRole,
): string {
  switch (
    role
  ) {
    case "OWNER":
      return "Propriétaire";


    case "MANAGER":
      return "Gestionnaire";


    case "STAFF":
      return "Personnel";


    default:
      return role;
  }
}


/* ==========================================================================
   LABEL STATUT MANAGER
   ========================================================================== */

export function getGestionnaireProfileManagerStatusLabel(
  status:
    GestionnaireProfileManagerStatus,
): string {
  switch (
    status
  ) {
    case "ACTIVE":
      return "Compte actif";


    case "SUSPENDED":
      return "Compte suspendu";


    case "DISABLED":
      return "Compte désactivé";


    default:
      return status;
  }
}


/* ==========================================================================
   LABEL STATUT BOUTIQUE
   ========================================================================== */

export function getGestionnaireProfileStoreStatusLabel(
  status:
    GestionnaireProfileStoreStatus,
): string {
  switch (
    status
  ) {
    case "ACTIVE":
      return "Boutique active";


    case "SUSPENDED":
      return "Boutique suspendue";


    case "DISABLED":
      return "Boutique désactivée";


    default:
      return status;
  }
}


/* ==========================================================================
   TYPE GUARD — RÔLE
   ========================================================================== */

export function isGestionnaireProfileRole(
  value:
    unknown,
): value is GestionnaireProfileRole {
  return (
    value ===
      "OWNER" ||
    value ===
      "MANAGER" ||
    value ===
      "STAFF"
  );
}


/* ==========================================================================
   TYPE GUARD — MANAGER STATUS
   ========================================================================== */

export function isGestionnaireProfileManagerStatus(
  value:
    unknown,
): value is GestionnaireProfileManagerStatus {
  return (
    value ===
      "ACTIVE" ||
    value ===
      "SUSPENDED" ||
    value ===
      "DISABLED"
  );
}


/* ==========================================================================
   TYPE GUARD — STORE STATUS
   ========================================================================== */

export function isGestionnaireProfileStoreStatus(
  value:
    unknown,
): value is GestionnaireProfileStoreStatus {
  return (
    value ===
      "ACTIVE" ||
    value ===
      "SUSPENDED" ||
    value ===
      "DISABLED"
  );
}


/* ==========================================================================
   INITIALS
   ========================================================================== */

/**
 * Génère uniquement une représentation visuelle à partir du nom réel
 * de la boutique.
 *
 * Exemple :
 *
 * "L&E Cosmetics Empire"
 * =>
 * "LC"
 *
 * Aucun prénom ou nom de personne n'est inventé.
 */

export function getGestionnaireProfileInitials(
  storeName:
    string,
): string {
  const words =
    storeName
      .trim()
      .split(
        /\s+/,
      )
      .map(
        (
          word,
        ) =>
          word.replace(
            /[^\p{L}\p{N}]/gu,
            "",
          ),
      )
      .filter(
        Boolean,
      );


  if (
    words.length ===
    0
  ) {
    return "—";
  }


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }


  return (
    words[0]
      .charAt(
        0,
      ) +
    words[1]
      .charAt(
        0,
      )
  ).toUpperCase();
}