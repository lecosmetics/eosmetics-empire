import "server-only";

import {
  db,
} from "@/prisma/db";

import {
  getCountryByCode,
} from "@/config/countries";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  isGestionnaireProfileManagerStatus,
  isGestionnaireProfileRole,
  isGestionnaireProfileStoreStatus,
  type GestionnaireProfileContactValues,
  type GestionnaireProfileCountry,
  type GestionnaireProfileManager,
  type GestionnaireProfilePageData,
  type GestionnaireProfileSecurity,
  type GestionnaireProfileStore,
} from "@/lib/gestionnaire/profil/profile-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — QUERY
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/profil/profile-query.ts
 *
 * RÔLE :
 *
 * Charger les données réelles nécessaires à :
 *
 * /gestionnaire/profil
 *
 *
 * RESPONSABILITÉS :
 *
 * - rester exclusivement côté serveur ;
 * - exiger un accès Gestionnaire privé valide ;
 * - récupérer managerId depuis la session sécurisée ;
 * - récupérer storeId depuis la session sécurisée ;
 * - relire les données fraîches depuis PostgreSQL ;
 * - vérifier à nouveau la relation Manager → Store ;
 * - ne sélectionner aucun secret inutile ;
 * - ne jamais charger passwordHash ;
 * - sérialiser les Date avant transmission aux composants ;
 * - résoudre le pays avec src/config/countries.ts ;
 * - préparer les valeurs initiales du formulaire de contact ;
 * - retourner un contrat stable défini dans profile-types.ts.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - accepter managerId depuis le navigateur ;
 * - accepter storeId depuis le navigateur ;
 * - accepter un rôle depuis le navigateur ;
 * - accepter un statut depuis le navigateur ;
 * - exposer passwordHash ;
 * - modifier la base ;
 * - modifier le mot de passe ;
 * - effectuer une Server Action ;
 * - inventer un nom ou un prénom ;
 * - inventer une photo ;
 * - inventer des préférences de notification ;
 * - inventer des sessions actives.
 *
 * ============================================================================
 */


/* ==========================================================================
   ERREURS INTERNES
   ========================================================================== */

/**
 * Ces codes restent strictement serveur.
 *
 * Ils servent à distinguer une incohérence de données d'une erreur
 * d'autorisation.
 *
 * requireGestionnairePrivateAccess() gère déjà les accès non autorisés.
 */

type GestionnaireProfileQueryFailureCode =
  | "PROFILE_NOT_FOUND"
  | "PROFILE_ACCESS_MISMATCH"
  | "PROFILE_INVALID_ROLE"
  | "PROFILE_INVALID_MANAGER_STATUS"
  | "PROFILE_INVALID_STORE_STATUS";


class GestionnaireProfileQueryError extends Error {
  readonly code:
    GestionnaireProfileQueryFailureCode;


  constructor(
    code:
      GestionnaireProfileQueryFailureCode,
  ) {
    super(
      code,
    );


    this.name =
      "GestionnaireProfileQueryError";


    this.code =
      code;
  }
}


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeStoredText(
  value:
    string,
): string {
  return value.trim();
}


/* ==========================================================================
   NORMALISATION EMAIL
   ========================================================================== */

function normalizeStoredEmail(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}


/* ==========================================================================
   DATE → ISO
   ========================================================================== */

function serializeDate(
  value:
    Date,
): string {
  return value.toISOString();
}


function serializeNullableDate(
  value:
    Date | null,
): string | null {
  return value
    ? value.toISOString()
    : null;
}


/* ==========================================================================
   PAYS
   ========================================================================== */

/**
 * Le catalogue pays existe déjà dans :
 *
 * src/config/countries.ts
 *
 * Store.country contient la valeur enregistrée en base.
 *
 * Si cette valeur ne correspond à aucun pays actuellement reconnu par
 * getCountryByCode(), on retourne null.
 *
 * Aucune donnée pays n'est inventée ici.
 */

function resolveProfileCountry(
  countryValue:
    string,
): GestionnaireProfileCountry | null {
  const normalizedCountry =
    countryValue
      .trim()
      .toUpperCase();


  if (
    !normalizedCountry
  ) {
    return null;
  }


  const country =
    getCountryByCode(
      normalizedCountry,
    );


  if (
    !country
  ) {
    return null;
  }


  return {
    code:
      country.code,

    name:
      country.name,

    dialCode:
      country.dialCode,
  };
}


/* ==========================================================================
   MANAGER DTO
   ========================================================================== */

function createManagerProfile(
  manager:
    Readonly<{
      id:
        string;

      email:
        string;

      role:
        unknown;

      status:
        unknown;

      emailVerifiedAt:
        Date | null;

      lastLoginAt:
        Date | null;

      passwordChangedAt:
        Date | null;

      createdAt:
        Date;

      updatedAt:
        Date;
    }>,
): GestionnaireProfileManager {
  /* ------------------------------------------------------------------------
     ROLE
     ------------------------------------------------------------------------ */

  if (
    !isGestionnaireProfileRole(
      manager.role,
    )
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_INVALID_ROLE",
    );
  }


  /* ------------------------------------------------------------------------
     STATUS
     ------------------------------------------------------------------------ */

  if (
    !isGestionnaireProfileManagerStatus(
      manager.status,
    )
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_INVALID_MANAGER_STATUS",
    );
  }


  return {
    id:
      manager.id,

    email:
      normalizeStoredEmail(
        manager.email,
      ),

    role:
      manager.role,

    status:
      manager.status,

    emailVerifiedAt:
      serializeNullableDate(
        manager.emailVerifiedAt,
      ),

    lastLoginAt:
      serializeNullableDate(
        manager.lastLoginAt,
      ),

    passwordChangedAt:
      serializeNullableDate(
        manager.passwordChangedAt,
      ),

    createdAt:
      serializeDate(
        manager.createdAt,
      ),

    updatedAt:
      serializeDate(
        manager.updatedAt,
      ),
  };
}


/* ==========================================================================
   STORE DTO
   ========================================================================== */

function createStoreProfile(
  store:
    Readonly<{
      id:
        string;

      name:
        string;

      slug:
        string;

      city:
        string;

      country:
        string;

      address:
        string;

      phone:
        string;

      email:
        string;

      status:
        unknown;

      createdAt:
        Date;

      updatedAt:
        Date;
    }>,
): GestionnaireProfileStore {
  if (
    !isGestionnaireProfileStoreStatus(
      store.status,
    )
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_INVALID_STORE_STATUS",
    );
  }


  return {
    id:
      store.id,

    name:
      normalizeStoredText(
        store.name,
      ),

    slug:
      normalizeStoredText(
        store.slug,
      ),

    country:
      normalizeStoredText(
        store.country,
      )
        .toUpperCase(),

    city:
      normalizeStoredText(
        store.city,
      ),

    address:
      normalizeStoredText(
        store.address,
      ),

    phone:
      normalizeStoredText(
        store.phone,
      ),

    email:
      normalizeStoredEmail(
        store.email,
      ),

    status:
      store.status,

    createdAt:
      serializeDate(
        store.createdAt,
      ),

    updatedAt:
      serializeDate(
        store.updatedAt,
      ),
  };
}


/* ==========================================================================
   SÉCURITÉ
   ========================================================================== */

function createSecurityProfile(
  manager:
    GestionnaireProfileManager,
): GestionnaireProfileSecurity {
  return {
    isEmailVerified:
      manager.emailVerifiedAt !==
      null,

    emailVerifiedAt:
      manager.emailVerifiedAt,

    lastLoginAt:
      manager.lastLoginAt,

    passwordChangedAt:
      manager.passwordChangedAt,
  };
}


/* ==========================================================================
   CONTACT VALUES
   ========================================================================== */

function createContactValues(
  store:
    GestionnaireProfileStore,

  country:
    GestionnaireProfileCountry | null,
): GestionnaireProfileContactValues {
  /**
   * Lorsqu'un pays reconnu existe, on utilise son code canonique.
   *
   * Sinon on conserve la valeur existante de la base.
   *
   * On ne remplace jamais silencieusement un pays inconnu par un autre.
   */

  const countryValue =
    country?.code ??
    store.country;


  return {
    phone:
      store.phone,

    country:
      countryValue,

    city:
      store.city,

    address:
      store.address,
  };
}


/* ==========================================================================
   QUERY PRINCIPALE
   ========================================================================== */

/**
 * Charge le profil du Gestionnaire actuellement authentifié.
 *
 * IMPORTANT :
 *
 * Cette fonction n'accepte volontairement AUCUN argument.
 *
 * Il n'existe donc aucun moyen pour le navigateur de demander :
 *
 * getGestionnaireProfilePageData({
 *   managerId: "...",
 *   storeId: "...",
 * });
 *
 * managerId et storeId sont obligatoirement obtenus depuis
 * requireGestionnairePrivateAccess().
 */

export async function getGestionnaireProfilePageData():
  Promise<GestionnaireProfilePageData> {
  /* =========================================================================
     1. ACCÈS PRIVÉ
     ========================================================================= */

  const access =
    await requireGestionnairePrivateAccess();


  const managerId =
    access.manager.id.trim();


  const storeId =
    access.store.id.trim();


  /**
   * Ces valeurs proviennent déjà de private-access.ts.
   *
   * Ce contrôle supplémentaire protège malgré tout la query contre un
   * contexte incomplet ou incohérent.
   */

  if (
    !managerId ||
    !storeId
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_ACCESS_MISMATCH",
    );
  }


  /* =========================================================================
     2. LECTURE FRAÎCHE DEPUIS POSTGRESQL
     =========================================================================
     
     La query est volontairement resserrée :
     
     - Manager exact ;
     - storeId exact ;
     - Manager ACTIVE ;
     - e-mail vérifié ;
     - Store exact ;
     - Store ACTIVE.
     
     Même si le statut change entre le contrôle d'accès et cette requête,
     aucune donnée privée obsolète n'est renvoyée.
     ========================================================================= */

  const record =
    await db.manager.findFirst({
      where: {
        id:
          managerId,

        storeId,

        status:
          "ACTIVE",

        emailVerifiedAt: {
          not:
            null,
        },

        store: {
          is: {
            id:
              storeId,

            status:
              "ACTIVE",
          },
        },
      },

      select: {
        id:
          true,

        storeId:
          true,

        email:
          true,

        role:
          true,

        status:
          true,

        emailVerifiedAt:
          true,

        lastLoginAt:
          true,

        passwordChangedAt:
          true,

        createdAt:
          true,

        updatedAt:
          true,

        store: {
          select: {
            id:
              true,

            name:
              true,

            slug:
              true,

            city:
              true,

            country:
              true,

            address:
              true,

            phone:
              true,

            email:
              true,

            status:
              true,

            createdAt:
              true,

            updatedAt:
              true,
          },
        },
      },
    });


  /* =========================================================================
     3. ENREGISTREMENT INTROUVABLE
     ========================================================================= */

  if (
    !record
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_NOT_FOUND",
    );
  }


  /* =========================================================================
     4. DOUBLE CONTRÔLE D'APPARTENANCE
     ========================================================================= */

  if (
    record.id !==
      managerId ||
    record.storeId !==
      storeId ||
    record.store.id !==
      storeId ||
    record.store.id !==
      record.storeId
  ) {
    throw new GestionnaireProfileQueryError(
      "PROFILE_ACCESS_MISMATCH",
    );
  }


  /* =========================================================================
     5. MANAGER
     ========================================================================= */

  const manager =
    createManagerProfile({
      id:
        record.id,

      email:
        record.email,

      role:
        record.role,

      status:
        record.status,

      emailVerifiedAt:
        record.emailVerifiedAt,

      lastLoginAt:
        record.lastLoginAt,

      passwordChangedAt:
        record.passwordChangedAt,

      createdAt:
        record.createdAt,

      updatedAt:
        record.updatedAt,
    });


  /* =========================================================================
     6. STORE
     ========================================================================= */

  const store =
    createStoreProfile({
      id:
        record.store.id,

      name:
        record.store.name,

      slug:
        record.store.slug,

      city:
        record.store.city,

      country:
        record.store.country,

      address:
        record.store.address,

      phone:
        record.store.phone,

      email:
        record.store.email,

      status:
        record.store.status,

      createdAt:
        record.store.createdAt,

      updatedAt:
        record.store.updatedAt,
    });


  /* =========================================================================
     7. PAYS
     ========================================================================= */

  const country =
    resolveProfileCountry(
      store.country,
    );


  /* =========================================================================
     8. SÉCURITÉ
     ========================================================================= */

  const security =
    createSecurityProfile(
      manager,
    );


  /* =========================================================================
     9. VALEURS INITIALES DU FORMULAIRE
     ========================================================================= */

  const contactValues =
    createContactValues(
      store,
      country,
    );


  /* =========================================================================
     10. DONNÉES FINALES
     ========================================================================= */

  return {
    manager,

    store,

    country,

    security,

    contactValues,
  };
}