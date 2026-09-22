import "server-only";

import {
  ManagerRole,
  ManagerStatus,
  StoreStatus,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  db,
} from "@/prisma/db";

import {
  clearGestionnaireSession,
  getGestionnaireSession,
} from "@/server/gestionnaire/session";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CONTRÔLE D'ACCÈS PRIVÉ
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/espace-prive/private-access.ts
 *
 * RÔLE :
 *
 * Ce module constitue la barrière serveur centrale de l'espace privé
 * Gestionnaire.
 *
 * Il vérifie qu'une requête appartient réellement à :
 *
 * 1. une session Gestionnaire valide ;
 * 2. un Manager toujours présent en base ;
 * 3. un Manager dont l'e-mail est vérifié ;
 * 4. un Manager ACTIVE ;
 * 5. une boutique correspondant réellement au Manager ;
 * 6. une boutique ACTIVE.
 *
 * IMPORTANT :
 *
 * - aucune information d'accès n'est acceptée depuis le navigateur ;
 * - storeId est toujours déterminé côté serveur ;
 * - managerId est toujours déterminé côté serveur ;
 * - ce module ne doit jamais être importé dans un Client Component ;
 * - un cookie signé ne suffit pas à lui seul à autoriser une ressource ;
 * - PostgreSQL reste la source de vérité ;
 * - une permission d'interface ne remplace jamais cette couche ;
 * - une ressource appartenant à une autre boutique ne doit jamais être
 *   révélée.
 *
 * UTILISÉ PAR :
 *
 * - layout privé Gestionnaire ;
 * - Server Components ;
 * - Server Actions ;
 * - Route Handlers ;
 * - produits ;
 * - images ;
 * - stock ;
 * - commandes ;
 * - clientes ;
 * - livraisons ;
 * - statistiques ;
 * - paramètres.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

/**
 * Cette route appartient à l'architecture d'authentification, pas à la
 * navigation visuelle du dashboard.
 *
 * On évite donc volontairement de dépendre de :
 *
 * config/gestionnaire-navigation.ts
 *
 * Cela empêche la couche de sécurité de casser si la configuration du menu
 * Gestionnaire évolue.
 */
const GESTIONNAIRE_LOGIN_ROUTE =
  "/gestionnaire/connexion" as const;


/* ==========================================================================
   LIMITES
   ========================================================================== */

const IDENTIFIER_MAX_LENGTH =
  191 as const;


/* ==========================================================================
   TYPES PUBLICS — ENUMS
   ========================================================================== */

/**
 * Les rôles et statuts proviennent directement de Prisma.
 *
 * Cela évite d'avoir des unions TypeScript locales qui pourraient diverger
 * du schema.prisma.
 */

export type GestionnairePrivateAccessRole =
  ManagerRole;


export type GestionnairePrivateManagerStatus =
  ManagerStatus;


export type GestionnairePrivateStoreStatus =
  StoreStatus;


/* ==========================================================================
   MANAGER PUBLIC SÛR
   ========================================================================== */

/**
 * Seulement les informations nécessaires à l'espace privé.
 *
 * Nous n'exposons jamais ici :
 *
 * - passwordHash ;
 * - données OTP ;
 * - tokens ;
 * - informations de récupération de mot de passe ;
 * - données internes inutiles.
 */

export interface GestionnairePrivateManager {
  readonly id:
    string;

  readonly email:
    string;

  readonly role:
    GestionnairePrivateAccessRole;

  readonly status:
    GestionnairePrivateManagerStatus;
}


/* ==========================================================================
   STORE PUBLIC SÛR
   ========================================================================== */

export interface GestionnairePrivateStore {
  readonly id:
    string;

  readonly name:
    string;

  readonly city:
    string | null;

  readonly country:
    string | null;

  readonly status:
    GestionnairePrivateStoreStatus;
}


/* ==========================================================================
   CONTEXTE D'ACCÈS
   ========================================================================== */

export interface GestionnairePrivateAccessContext {
  readonly manager:
    GestionnairePrivateManager;

  readonly store:
    GestionnairePrivateStore;
}


/* ==========================================================================
   ENREGISTREMENT PRISMA INTERNE
   ========================================================================== */

/**
 * Représentation minimale nécessaire à la décision d'autorisation.
 */

interface PrivateManagerRecord {
  readonly id:
    string;

  readonly email:
    string;

  readonly role:
    ManagerRole;

  readonly status:
    ManagerStatus;

  readonly emailVerifiedAt:
    Date | null;

  readonly storeId:
    string;

  readonly store: {
    readonly id:
      string;

    readonly name:
      string;

    readonly city:
      string;

    readonly country:
      string;

    readonly status:
      StoreStatus;
  };
}


/* ==========================================================================
   RAISONS INTERNES D'ÉCHEC
   ========================================================================== */

/**
 * Ces valeurs ne doivent pas être affichées directement au navigateur.
 *
 * Elles servent uniquement à la logique serveur.
 */

export type GestionnairePrivateAccessFailureReason =
  | "NO_SESSION"
  | "INVALID_SESSION_MANAGER_ID"
  | "MANAGER_NOT_FOUND"
  | "EMAIL_NOT_VERIFIED"
  | "MANAGER_INACTIVE"
  | "STORE_MISMATCH"
  | "STORE_INACTIVE";


/* ==========================================================================
   RÉSULTAT INTERNE
   ========================================================================== */

interface PrivateAccessSuccess {
  readonly authorized:
    true;

  readonly context:
    GestionnairePrivateAccessContext;
}


interface PrivateAccessFailure {
  readonly authorized:
    false;

  readonly reason:
    GestionnairePrivateAccessFailureReason;
}


type PrivateAccessResult =
  | PrivateAccessSuccess
  | PrivateAccessFailure;


/* ==========================================================================
   IDENTIFIANT
   ========================================================================== */

/**
 * Normalisation défensive des identifiants Prisma.
 *
 * Compatible avec les identifiants de type CUID utilisés par le projet.
 */

function normalizeIdentifier(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    normalized.length ===
      0 ||
    normalized.length >
      IDENTIFIER_MAX_LENGTH
  ) {
    return null;
  }


  /**
   * Aucun :
   *
   * - slash ;
   * - espace ;
   * - point ;
   * - caractère de contrôle ;
   * - séquence de chemin.
   */
  if (
    !/^[A-Za-z0-9_-]+$/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   TEXTE OBLIGATOIRE
   ========================================================================== */

function normalizeRequiredText(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


/* ==========================================================================
   EMAIL
   ========================================================================== */

function normalizeEmail(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value
    .trim()
    .toLowerCase();
}


/* ==========================================================================
   MANAGER EN BASE
   ========================================================================== */

/**
 * Recherche le Manager correspondant au sujet de la session.
 *
 * Nous ne sélectionnons que les champs nécessaires.
 */

async function findPrivateManager(
  managerId:
    string,
): Promise<PrivateManagerRecord | null> {
  const manager =
    await db.manager.findUnique({
      where: {
        id:
          managerId,
      },

      select: {
        id:
          true,

        email:
          true,

        role:
          true,

        status:
          true,

        emailVerifiedAt:
          true,

        storeId:
          true,

        store: {
          select: {
            id:
              true,

            name:
              true,

            city:
              true,

            country:
              true,

            status:
              true,
          },
        },
      },
    });


  if (
    !manager
  ) {
    return null;
  }


  return manager;
}


/* ==========================================================================
   CONSTRUCTION DU CONTEXTE
   ========================================================================== */

function buildPrivateAccessContext(
  manager:
    PrivateManagerRecord,
): GestionnairePrivateAccessContext {
  const managerId =
    normalizeIdentifier(
      manager.id,
    );


  const storeId =
    normalizeIdentifier(
      manager.store.id,
    );


  const email =
    normalizeEmail(
      manager.email,
    );


  const storeName =
    normalizeRequiredText(
      manager.store.name,
    );


  const city =
    normalizeRequiredText(
      manager.store.city,
    );


  const country =
    normalizeRequiredText(
      manager.store.country,
    );


  if (
    !managerId ||
    !storeId ||
    !email ||
    !storeName
  ) {
    /**
     * Une donnée obligatoire provenant de la base est incohérente.
     *
     * Ce cas ne doit pas être transformé silencieusement en contexte valide.
     */
    throw new Error(
      "GESTIONNAIRE_PRIVATE_ACCESS_CONTEXT_INVALID",
    );
  }


  return {
    manager: {
      id:
        managerId,

      email,

      role:
        manager.role,

      status:
        manager.status,
    },

    store: {
      id:
        storeId,

      name:
        storeName,

      city:
        city ||
        null,

      country:
        country ||
        null,

      status:
        manager.store.status,
    },
  };
}


/* ==========================================================================
   ÉVALUATION COMPLÈTE
   ========================================================================== */

/**
 * Vérifie entièrement l'accès sans déclencher de redirect().
 *
 * IMPORTANT :
 *
 * Les erreurs d'infrastructure comme :
 *
 * - PostgreSQL inaccessible ;
 * - Prisma défaillant ;
 *
 * ne sont volontairement pas absorbées ici.
 *
 * Elles doivent remonter vers la gestion d'erreur serveur plutôt que d'être
 * confondues avec une simple absence de session.
 */

async function evaluateGestionnairePrivateAccess():
  Promise<PrivateAccessResult> {
  /* ------------------------------------------------------------------------
     1. SESSION
     ------------------------------------------------------------------------ */

  const session =
    await getGestionnaireSession();


  if (
    !session
  ) {
    return {
      authorized:
        false,

      reason:
        "NO_SESSION",
    };
  }


  /* ------------------------------------------------------------------------
     2. IDENTIFIANT DU MANAGER
     ------------------------------------------------------------------------ */

  const managerId =
    normalizeIdentifier(
      session.gestionnaireId,
    );


  if (
    !managerId
  ) {
    return {
      authorized:
        false,

      reason:
        "INVALID_SESSION_MANAGER_ID",
    };
  }


  /* ------------------------------------------------------------------------
     3. MANAGER
     ------------------------------------------------------------------------ */

  const manager =
    await findPrivateManager(
      managerId,
    );


  if (
    !manager
  ) {
    return {
      authorized:
        false,

      reason:
        "MANAGER_NOT_FOUND",
    };
  }


  /* ------------------------------------------------------------------------
     4. COHÉRENCE IDENTITÉ
     ------------------------------------------------------------------------ */

  if (
    manager.id !==
    managerId
  ) {
    return {
      authorized:
        false,

      reason:
        "MANAGER_NOT_FOUND",
    };
  }


  /* ------------------------------------------------------------------------
     5. EMAIL VÉRIFIÉ
     ------------------------------------------------------------------------ */

  if (
    manager.emailVerifiedAt ===
    null
  ) {
    return {
      authorized:
        false,

      reason:
        "EMAIL_NOT_VERIFIED",
    };
  }


  /* ------------------------------------------------------------------------
     6. MANAGER ACTIVE
     ------------------------------------------------------------------------ */

  if (
    manager.status !==
    ManagerStatus.ACTIVE
  ) {
    return {
      authorized:
        false,

      reason:
        "MANAGER_INACTIVE",
    };
  }


  /* ------------------------------------------------------------------------
     7. COHÉRENCE MANAGER / STORE
     ------------------------------------------------------------------------ */

  const managerStoreId =
    normalizeIdentifier(
      manager.storeId,
    );


  const relatedStoreId =
    normalizeIdentifier(
      manager.store.id,
    );


  if (
    !managerStoreId ||
    !relatedStoreId ||
    managerStoreId !==
      relatedStoreId
  ) {
    return {
      authorized:
        false,

      reason:
        "STORE_MISMATCH",
    };
  }


  /* ------------------------------------------------------------------------
     8. BOUTIQUE ACTIVE
     ------------------------------------------------------------------------ */

  if (
    manager.store.status !==
    StoreStatus.ACTIVE
  ) {
    return {
      authorized:
        false,

      reason:
        "STORE_INACTIVE",
    };
  }


  /* ------------------------------------------------------------------------
     9. CONTEXTE FINAL
     ------------------------------------------------------------------------ */

  return {
    authorized:
      true,

    context:
      buildPrivateAccessContext(
        manager,
      ),
  };
}


/* ==========================================================================
   ACCÈS OPTIONNEL
   ========================================================================== */

/**
 * Retourne le contexte uniquement si l'accès est valide.
 *
 * Aucune redirection.
 *
 * Adapté notamment aux :
 *
 * - Route Handlers ;
 * - Server Actions ;
 * - services serveur ;
 * - pages qui souhaitent tester facultativement une authentification.
 */

export async function getGestionnairePrivateAccess():
  Promise<GestionnairePrivateAccessContext | null> {
  const result =
    await evaluateGestionnairePrivateAccess();


  if (
    !result.authorized
  ) {
    return null;
  }


  return result.context;
}


/* ==========================================================================
   BOOLEAN ACCESS
   ========================================================================== */

export async function hasGestionnairePrivateAccess():
  Promise<boolean> {
  const result =
    await evaluateGestionnairePrivateAccess();


  return result.authorized;
}


/* ==========================================================================
   ACCÈS PRIVÉ OBLIGATOIRE
   ========================================================================== */

/**
 * Point d'entrée principal des pages privées.
 *
 * Exemple :
 *
 * const access =
 *   await requireGestionnairePrivateAccess();
 *
 * const storeId =
 *   access.store.id;
 *
 * storeId ne vient jamais du navigateur.
 */

export async function requireGestionnairePrivateAccess():
  Promise<GestionnairePrivateAccessContext> {
  const result =
    await evaluateGestionnairePrivateAccess();


  if (
    result.authorized
  ) {
    return result.context;
  }


  /* ------------------------------------------------------------------------
     NETTOYAGE DE LA SESSION
     ------------------------------------------------------------------------
     
     Best effort :
     
     certains contextes Server Component peuvent ne pas autoriser une
     modification de cookie à cet instant.
     
     L'échec du nettoyage ne réautorise jamais l'accès.
     ------------------------------------------------------------------------ */

  try {
    await clearGestionnaireSession();
  } catch {
    /**
     * Rien à exposer.
     *
     * La session vient déjà d'être refusée par l'évaluation serveur.
     */
  }


  /* ------------------------------------------------------------------------
     REDIRECTION
     ------------------------------------------------------------------------ */

  redirect(
    GESTIONNAIRE_LOGIN_ROUTE,
  );
}


/* ==========================================================================
   ASSERTION SANS REDIRECTION
   ========================================================================== */

/**
 * Version destinée aux services qui ne souhaitent pas utiliser
 * next/navigation.redirect().
 *
 * Une erreur générique est volontairement utilisée.
 */

export async function assertGestionnairePrivateAccess():
  Promise<GestionnairePrivateAccessContext> {
  const result =
    await evaluateGestionnairePrivateAccess();


  if (
    !result.authorized
  ) {
    throw new Error(
      "GESTIONNAIRE_PRIVATE_ACCESS_REQUIRED",
    );
  }


  return result.context;
}


/* ==========================================================================
   APPARTENANCE À LA BOUTIQUE
   ========================================================================== */

/**
 * Vérifie qu'une ressource appartient exactement à la boutique courante.
 *
 * Exemple :
 *
 * isGestionnaireStoreResourceAllowed(
 *   access,
 *   storeProduct.storeId,
 * )
 */

export function isGestionnaireStoreResourceAllowed(
  access:
    GestionnairePrivateAccessContext,

  resourceStoreId:
    string,
): boolean {
  const expectedStoreId =
    normalizeIdentifier(
      access.store.id,
    );


  const candidateStoreId =
    normalizeIdentifier(
      resourceStoreId,
    );


  if (
    !expectedStoreId ||
    !candidateStoreId
  ) {
    return false;
  }


  return (
    expectedStoreId ===
    candidateStoreId
  );
}


/* ==========================================================================
   ASSERTION D'APPARTENANCE
   ========================================================================== */

/**
 * Ne révèle volontairement pas si la ressource appartient à une autre
 * boutique.
 */

export function assertGestionnaireStoreResourceAllowed(
  access:
    GestionnairePrivateAccessContext,

  resourceStoreId:
    string,
): void {
  if (
    !isGestionnaireStoreResourceAllowed(
      access,
      resourceStoreId,
    )
  ) {
    throw new Error(
      "GESTIONNAIRE_RESOURCE_ACCESS_DENIED",
    );
  }
}


/* ==========================================================================
   MANAGER COURANT
   ========================================================================== */

export function isCurrentGestionnaireManager(
  access:
    GestionnairePrivateAccessContext,

  managerId:
    string,
): boolean {
  const expectedManagerId =
    normalizeIdentifier(
      access.manager.id,
    );


  const candidateManagerId =
    normalizeIdentifier(
      managerId,
    );


  if (
    !expectedManagerId ||
    !candidateManagerId
  ) {
    return false;
  }


  return (
    expectedManagerId ===
    candidateManagerId
  );
}


/* ==========================================================================
   ASSERTION MANAGER COURANT
   ========================================================================== */

export function assertCurrentGestionnaireManager(
  access:
    GestionnairePrivateAccessContext,

  managerId:
    string,
): void {
  if (
    !isCurrentGestionnaireManager(
      access,
      managerId,
    )
  ) {
    throw new Error(
      "GESTIONNAIRE_MANAGER_ACCESS_DENIED",
    );
  }
}


/* ==========================================================================
   RÔLES
   ========================================================================== */

/**
 * Vérifie si le rôle réel du Manager appartient à la liste autorisée.
 *
 * Les rôles viennent exclusivement de Prisma.
 */

export function hasGestionnaireRole(
  access:
    GestionnairePrivateAccessContext,

  allowedRoles:
    readonly GestionnairePrivateAccessRole[],
): boolean {
  if (
    allowedRoles.length ===
    0
  ) {
    return false;
  }


  return allowedRoles.includes(
    access.manager.role,
  );
}


/* ==========================================================================
   ASSERTION DE RÔLE
   ========================================================================== */

export function assertGestionnaireRole(
  access:
    GestionnairePrivateAccessContext,

  allowedRoles:
    readonly GestionnairePrivateAccessRole[],
): void {
  if (
    !hasGestionnaireRole(
      access,
      allowedRoles,
    )
  ) {
    throw new Error(
      "GESTIONNAIRE_ROLE_ACCESS_DENIED",
    );
  }
}


/* ==========================================================================
   OWNER
   ========================================================================== */

export function isGestionnaireOwner(
  access:
    GestionnairePrivateAccessContext,
): boolean {
  return (
    access.manager.role ===
    ManagerRole.OWNER
  );
}


/* ==========================================================================
   MANAGER
   ========================================================================== */

export function isGestionnaireManagerRole(
  access:
    GestionnairePrivateAccessContext,
): boolean {
  return (
    access.manager.role ===
    ManagerRole.MANAGER
  );
}


/* ==========================================================================
   STAFF
   ========================================================================== */

export function isGestionnaireStaff(
  access:
    GestionnairePrivateAccessContext,
): boolean {
  return (
    access.manager.role ===
    ManagerRole.STAFF
  );
}


/* ==========================================================================
   OWNER OU MANAGER
   ========================================================================== */

export function isGestionnaireOwnerOrManager(
  access:
    GestionnairePrivateAccessContext,
): boolean {
  return (
    access.manager.role ===
      ManagerRole.OWNER ||
    access.manager.role ===
      ManagerRole.MANAGER
  );
}


/* ==========================================================================
   ASSERTION OWNER OU MANAGER
   ========================================================================== */

export function assertGestionnaireOwnerOrManager(
  access:
    GestionnairePrivateAccessContext,
): void {
  if (
    !isGestionnaireOwnerOrManager(
      access,
    )
  ) {
    throw new Error(
      "GESTIONNAIRE_PRIVILEGED_ROLE_REQUIRED",
    );
  }
}