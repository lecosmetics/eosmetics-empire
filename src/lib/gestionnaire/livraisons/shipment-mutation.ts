import "server-only";

import {
  AuditAction,
  type Prisma,
  type ShipmentStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  MANAGER_SHIPMENT_ID_MAX_LENGTH,
  MANAGER_SHIPMENT_STATUSES,
  getManagerShipmentAuthorizedActions,
  isManagerShipmentStatus,
  type ManagerShipmentAction,
  type ManagerShipmentStatus,
} from "./shipment-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/livraisons/shipment-mutation.ts
 *
 * RESPONSABILITÉS :
 *
 * - vérifier l'accès Gestionnaire côté serveur ;
 * - récupérer storeId et managerId depuis la session sécurisée ;
 * - vérifier que le Shipment appartient réellement au store ;
 * - vérifier également que la Order liée appartient au même store ;
 * - contrôler les transitions de statut ;
 * - empêcher les doubles confirmations ;
 * - empêcher les doubles annulations ;
 * - mettre DELIVERED + deliveredAt lors d'une confirmation ;
 * - mettre CANCELLED lors d'une annulation ;
 * - conserver la modification et l'audit dans la même transaction ;
 * - retourner uniquement les données nécessaires aux notifications ;
 * - ne jamais dépendre du navigateur pour une autorisation métier.
 *
 * IMPORTANT :
 *
 * CE FICHIER NE :
 *
 * - n'envoie aucun e-mail ;
 * - n'envoie aucun WhatsApp ;
 * - n'appelle aucune API externe ;
 * - ne fait aucun revalidatePath ;
 * - ne modifie aucun paiement ;
 * - ne crée aucun tracking ;
 * - ne crée aucun transporteur ;
 * - ne crée aucun cancelledAt inexistant ;
 * - ne modifie pas automatiquement Order.status sans règle officielle.
 *
 * Les notifications seront déclenchées APRÈS le commit réussi par :
 *
 * shipment-notifications.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   ÉVÉNEMENTS D'AUDIT
   ========================================================================== */

/**
 * AuditAction ne possède actuellement pas de valeur spécialisée pour
 * les livraisons.
 *
 * On utilise donc l'enum existant :
 *
 * AuditAction.OTHER
 *
 * et on conserve la nature précise de l'événement dans metadata.event.
 *
 * Aucun nouvel enum Prisma n'est inventé.
 */

const AUDIT_EVENT_DELIVERY_CONFIRMED =
  "DELIVERY_CONFIRMED";


const AUDIT_EVENT_DELIVERY_CANCELLED =
  "DELIVERY_CANCELLED";


/* ==========================================================================
   ENTITY TYPE AUDIT
   ========================================================================== */

const AUDIT_ENTITY_TYPE =
  "Shipment";


/* ==========================================================================
   TRANSITIONS RÉELLEMENT AUTORISÉES
   ========================================================================== */

/**
 * Ces tableaux sont dérivés de la règle centrale déjà définie dans
 * shipment-types.ts.
 *
 * Cela évite d'avoir une règle UI et une règle serveur complètement
 * différentes.
 *
 * ATTENTION :
 *
 * même si l'UI indique qu'une action est possible, la transaction serveur
 * refait toujours son propre contrôle.
 */

const CONFIRMABLE_SHIPMENT_STATUSES:
  readonly ManagerShipmentStatus[] =
    MANAGER_SHIPMENT_STATUSES.filter(
      (
        status,
      ) =>
        getManagerShipmentAuthorizedActions(
          status,
        ).canConfirm,
    );


const CANCELLABLE_SHIPMENT_STATUSES:
  readonly ManagerShipmentStatus[] =
    MANAGER_SHIPMENT_STATUSES.filter(
      (
        status,
      ) =>
        getManagerShipmentAuthorizedActions(
          status,
        ).canCancel,
    );


/* ==========================================================================
   ERROR CODES
   ========================================================================== */

export type ManagerShipmentMutationErrorCode =
  | "INVALID_SHIPMENT_ID"
  | "SHIPMENT_NOT_FOUND"
  | "TRANSITION_NOT_ALLOWED"
  | "MUTATION_FAILED";


/* ==========================================================================
   ERREUR MÉTIER
   ========================================================================== */

export class ManagerShipmentMutationError extends Error {
  public readonly code:
    ManagerShipmentMutationErrorCode;


  public constructor(
    code:
      ManagerShipmentMutationErrorCode,

    message:
      string,
  ) {
    super(
      message,
    );


    this.name =
      "ManagerShipmentMutationError";


    this.code =
      code;


    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}


/* ==========================================================================
   CONTEXTE DE NOTIFICATION
   ========================================================================== */

/**
 * Ces données sont retournées après la transaction afin que
 * shipment-notifications.ts puisse envoyer les notifications.
 *
 * On utilise les snapshots de la Order / Shipment existants.
 *
 * Aucun Customer global n'est nécessaire pour envoyer une notification
 * concernant cette ancienne commande.
 */

export interface ManagerShipmentMutationNotificationContext {
  readonly shipmentId:
    string;

  readonly shipmentNumber:
    string;

  readonly orderId:
    string;

  readonly orderNumber:
    string;

  readonly customerFirstName:
    string;

  readonly customerEmail:
    string | null;

  readonly customerPhone:
    string | null;
}


/* ==========================================================================
   RÉSULTAT MUTATION
   ========================================================================== */

export interface ManagerShipmentMutationResult {
  /**
   * UPDATED :
   *
   * cette requête a réellement effectué la transition.
   *
   * ALREADY_APPLIED :
   *
   * une précédente requête a déjà effectué exactement la même transition.
   * Dans ce cas, aucune nouvelle notification ne doit être envoyée.
   */
  readonly outcome:
    | "UPDATED"
    | "ALREADY_APPLIED";

  readonly action:
    ManagerShipmentAction;

  readonly changed:
    boolean;

  readonly shipmentId:
    string;

  readonly shipmentNumber:
    string;

  readonly orderId:
    string;

  readonly orderNumber:
    string;

  readonly previousStatus:
    ManagerShipmentStatus;

  readonly status:
    ManagerShipmentStatus;

  readonly deliveredAt:
    string | null;

  readonly notification:
    ManagerShipmentMutationNotificationContext;
}


/* ==========================================================================
   DONNÉE INTERNE SHIPMENT
   ========================================================================== */

interface ShipmentMutationResource {
  readonly id:
    string;

  readonly shipmentNumber:
    string;

  readonly status:
    ShipmentStatus;

  readonly deliveredAt:
    Date | null;

  readonly orderId:
    string;

  readonly recipientName:
    string;

  readonly phone:
    string | null;

  readonly order: {
    readonly id:
      string;

    readonly storeId:
      string;

    readonly orderNumber:
      string;

    readonly customerFirstName:
      string;

    readonly customerEmail:
      string | null;

    readonly customerPhone:
      string | null;
  };
}


/* ==========================================================================
   INPUT INTERNE
   ========================================================================== */

interface ExecuteManagerShipmentMutationInput {
  readonly shipmentId:
    string;

  readonly action:
    ManagerShipmentAction;
}


/* ==========================================================================
   NORMALISATION IDENTIFIANT
   ========================================================================== */

function normalizeShipmentId(
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
    !normalized ||
    normalized.length >
      MANAGER_SHIPMENT_ID_MAX_LENGTH
  ) {
    return null;
  }


  if (
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   TEXTE OPTIONNEL
   ========================================================================== */

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   STATUT SÛR
   ========================================================================== */

function normalizeShipmentStatus(
  value:
    ShipmentStatus,
): ManagerShipmentStatus {
  if (
    !isManagerShipmentStatus(
      value,
    )
  ) {
    throw new ManagerShipmentMutationError(
      "MUTATION_FAILED",
      "Le statut de cette livraison n’est pas pris en charge.",
    );
  }


  return value;
}


/* ==========================================================================
   DATE SERIALIZATION
   ========================================================================== */

function serializeDate(
  value:
    Date | null,
): string | null {
  return value
    ? value.toISOString()
    : null;
}


/* ==========================================================================
   STATUT CIBLE
   ========================================================================== */

function getTargetStatus(
  action:
    ManagerShipmentAction,
): ManagerShipmentStatus {
  switch (
    action
  ) {
    case "confirm":
      return "DELIVERED";

    case "cancel":
      return "CANCELLED";
  }
}


/* ==========================================================================
   STATUTS SOURCES AUTORISÉS
   ========================================================================== */

function getAllowedSourceStatuses(
  action:
    ManagerShipmentAction,
): readonly ManagerShipmentStatus[] {
  switch (
    action
  ) {
    case "confirm":
      return CONFIRMABLE_SHIPMENT_STATUSES;

    case "cancel":
      return CANCELLABLE_SHIPMENT_STATUSES;
  }
}


/* ==========================================================================
   ÉVÉNEMENT AUDIT
   ========================================================================== */

function getAuditEvent(
  action:
    ManagerShipmentAction,
): string {
  switch (
    action
  ) {
    case "confirm":
      return AUDIT_EVENT_DELIVERY_CONFIRMED;

    case "cancel":
      return AUDIT_EVENT_DELIVERY_CANCELLED;
  }
}


/* ==========================================================================
   CUSTOMER PHONE
   ========================================================================== */

/**
 * Priorité :
 *
 * 1. téléphone snapshot de la commande ;
 * 2. téléphone du destinataire Shipment.
 *
 * La validation internationale définitive sera faite dans le provider
 * WhatsApp, pas ici.
 */

function getNotificationPhone(
  resource:
    ShipmentMutationResource,
): string | null {
  return (
    normalizeOptionalText(
      resource
        .order
        .customerPhone,
    ) ??
    normalizeOptionalText(
      resource.phone,
    )
  );
}


/* ==========================================================================
   CONTEXTE NOTIFICATION
   ========================================================================== */

function createNotificationContext(
  resource:
    ShipmentMutationResource,
): ManagerShipmentMutationNotificationContext {
  return {
    shipmentId:
      resource.id,

    shipmentNumber:
      resource.shipmentNumber,

    orderId:
      resource
        .order
        .id,

    orderNumber:
      resource
        .order
        .orderNumber,

    customerFirstName:
      resource
        .order
        .customerFirstName
        .trim(),

    customerEmail:
      normalizeOptionalText(
        resource
          .order
          .customerEmail,
      ),

    customerPhone:
      getNotificationPhone(
        resource,
      ),
  };
}


/* ==========================================================================
   CHARGEMENT SÉCURISÉ DANS LA TRANSACTION
   ========================================================================== */

async function findShipmentForMutation(
  tx:
    Prisma.TransactionClient,

  shipmentId:
    string,

  storeId:
    string,
): Promise<ShipmentMutationResource | null> {
  return tx.shipment.findFirst({
    where: {
      id:
        shipmentId,

      storeId,

      order: {
        is: {
          storeId,
        },
      },
    },

    select: {
      id:
        true,

      shipmentNumber:
        true,

      status:
        true,

      deliveredAt:
        true,

      orderId:
        true,

      recipientName:
        true,

      phone:
        true,

      order: {
        select: {
          id:
            true,

          storeId:
            true,

          orderNumber:
            true,

          customerFirstName:
            true,

          customerEmail:
            true,

          customerPhone:
            true,
        },
      },
    },
  });
}


/* ==========================================================================
   RÉSULTAT DÉJÀ APPLIQUÉ
   ========================================================================== */

function createAlreadyAppliedResult({
  resource,
  action,
  targetStatus,
}: {
  readonly resource:
    ShipmentMutationResource;

  readonly action:
    ManagerShipmentAction;

  readonly targetStatus:
    ManagerShipmentStatus;
}): ManagerShipmentMutationResult {
  return {
    outcome:
      "ALREADY_APPLIED",

    action,

    changed:
      false,

    shipmentId:
      resource.id,

    shipmentNumber:
      resource.shipmentNumber,

    orderId:
      resource.order.id,

    orderNumber:
      resource.order.orderNumber,

    previousStatus:
      targetStatus,

    status:
      targetStatus,

    deliveredAt:
      serializeDate(
        resource.deliveredAt,
      ),

    notification:
      createNotificationContext(
        resource,
      ),
  };
}


/* ==========================================================================
   TRANSITION REFUSÉE
   ========================================================================== */

function throwTransitionNotAllowed(
  currentStatus:
    ManagerShipmentStatus,
): never {
  throw new ManagerShipmentMutationError(
    "TRANSITION_NOT_ALLOWED",
    `Cette action n’est pas autorisée lorsque la livraison est au statut ${currentStatus}.`,
  );
}


/* ==========================================================================
   AUDIT
   ========================================================================== */

async function createShipmentAudit({
  tx,
  storeId,
  managerId,
  action,
  shipmentId,
  shipmentNumber,
  orderId,
  orderNumber,
  previousStatus,
  nextStatus,
}: {
  readonly tx:
    Prisma.TransactionClient;

  readonly storeId:
    string;

  readonly managerId:
    string;

  readonly action:
    ManagerShipmentAction;

  readonly shipmentId:
    string;

  readonly shipmentNumber:
    string;

  readonly orderId:
    string;

  readonly orderNumber:
    string;

  readonly previousStatus:
    ManagerShipmentStatus;

  readonly nextStatus:
    ManagerShipmentStatus;
}): Promise<void> {
  await tx.auditLog.create({
    data: {
      storeId,

      managerId,

      action:
        AuditAction.OTHER,

      entityType:
        AUDIT_ENTITY_TYPE,

      entityId:
        shipmentId,

      metadata: {
        event:
          getAuditEvent(
            action,
          ),

        shipmentId,

        shipmentNumber,

        orderId,

        orderNumber,

        previousStatus,

        nextStatus,
      },
    },
  });
}


/* ==========================================================================
   UPDATE ATOMIQUE
   ========================================================================== */

/**
 * L'idempotence importante se trouve ici.
 *
 * On n'utilise PAS :
 *
 * find -> update sans condition.
 *
 * À la place :
 *
 * UPDATE ... WHERE
 *
 * id = shipmentId
 * storeId = session.store.id
 * status IN statuts_autorisés
 *
 * Ainsi, si deux requêtes Confirmer arrivent pratiquement au même moment :
 *
 * requête A :
 *   count = 1
 *
 * requête B :
 *   count = 0
 *
 * La requête B détectera ensuite que DELIVERED est déjà appliqué et
 * retournera ALREADY_APPLIED.
 *
 * Elle ne créera donc :
 *
 * - aucun deuxième audit ;
 * - aucune deuxième notification.
 */

async function executeAtomicShipmentUpdate({
  tx,
  shipmentId,
  storeId,
  action,
  now,
}: {
  readonly tx:
    Prisma.TransactionClient;

  readonly shipmentId:
    string;

  readonly storeId:
    string;

  readonly action:
    ManagerShipmentAction;

  readonly now:
    Date;
}): Promise<number> {
  const allowedStatuses =
    getAllowedSourceStatuses(
      action,
    );


  if (
    allowedStatuses.length ===
      0
  ) {
    throw new ManagerShipmentMutationError(
      "MUTATION_FAILED",
      "Aucune transition de livraison n’est configurée pour cette action.",
    );
  }


  const targetStatus =
    getTargetStatus(
      action,
    );


  const result =
    await tx.shipment.updateMany({
      where: {
        id:
          shipmentId,

        storeId,

        status: {
          in:
            [...allowedStatuses],
        },

        order: {
          is: {
            storeId,
          },
        },
      },

      data:
        action ===
        "confirm"
          ? {
              status:
                targetStatus,

              deliveredAt:
                now,
            }
          : {
              status:
                targetStatus,
            },
    });


  return result.count;
}


/* ==========================================================================
   MUTATION PRINCIPALE
   ========================================================================== */

async function executeManagerShipmentMutation({
  shipmentId,
  action,
}: ExecuteManagerShipmentMutationInput): Promise<ManagerShipmentMutationResult> {
  /* ------------------------------------------------------------------------
     SESSION / STORE / MANAGER
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  const managerId =
    access.manager.id;


  /* ------------------------------------------------------------------------
     IDENTIFIANT
     ------------------------------------------------------------------------ */

  const normalizedShipmentId =
    normalizeShipmentId(
      shipmentId,
    );


  if (
    !normalizedShipmentId
  ) {
    throw new ManagerShipmentMutationError(
      "INVALID_SHIPMENT_ID",
      "Identifiant de livraison invalide.",
    );
  }


  /* ------------------------------------------------------------------------
     TRANSACTION
     ------------------------------------------------------------------------ */

  return db.$transaction(
    async (
      tx,
    ) => {
      /* --------------------------------------------------------------------
         RESSOURCE COURANTE
         -------------------------------------------------------------------- */

      const initialResource =
        await findShipmentForMutation(
          tx,
          normalizedShipmentId,
          storeId,
        );


      if (
        !initialResource
      ) {
        /**
         * Même réponse pour :
         *
         * - livraison inexistante ;
         * - livraison d'une autre boutique.
         *
         * On ne révèle pas l'existence d'une ressource étrangère.
         */
        throw new ManagerShipmentMutationError(
          "SHIPMENT_NOT_FOUND",
          "Cette livraison est introuvable ou inaccessible.",
        );
      }


      const initialStatus =
        normalizeShipmentStatus(
          initialResource.status,
        );


      const targetStatus =
        getTargetStatus(
          action,
        );


      /* --------------------------------------------------------------------
         IDEMPOTENCE AVANT UPDATE
         -------------------------------------------------------------------- */

      if (
        initialStatus ===
        targetStatus
      ) {
        return createAlreadyAppliedResult({
          resource:
            initialResource,

          action,

          targetStatus,
        });
      }


      /* --------------------------------------------------------------------
         CONTRÔLE DE TRANSITION
         -------------------------------------------------------------------- */

      const permissions =
        getManagerShipmentAuthorizedActions(
          initialStatus,
        );


      const actionIsAllowed =
        action ===
        "confirm"
          ? permissions.canConfirm
          : permissions.canCancel;


      if (
        !actionIsAllowed
      ) {
        throwTransitionNotAllowed(
          initialStatus,
        );
      }


      /* --------------------------------------------------------------------
         UPDATE CONDITIONNEL
         -------------------------------------------------------------------- */

      const now =
        new Date();


      const updatedCount =
        await executeAtomicShipmentUpdate({
          tx,

          shipmentId:
            normalizedShipmentId,

          storeId,

          action,

          now,
        });


      /* --------------------------------------------------------------------
         CONCURRENCE / DOUBLE SOUMISSION
         -------------------------------------------------------------------- */

      if (
        updatedCount !==
        1
      ) {
        /**
         * Une autre requête a potentiellement modifié le statut entre :
         *
         * lecture initiale
         * et
         * UPDATE.
         *
         * On relit donc la source de vérité.
         */

        const currentResource =
          await findShipmentForMutation(
            tx,
            normalizedShipmentId,
            storeId,
          );


        if (
          !currentResource
        ) {
          throw new ManagerShipmentMutationError(
            "SHIPMENT_NOT_FOUND",
            "Cette livraison est introuvable ou inaccessible.",
          );
        }


        const currentStatus =
          normalizeShipmentStatus(
            currentResource.status,
          );


        /* ------------------------------------------------------------------
           MÊME ACTION DÉJÀ APPLIQUÉE
           ------------------------------------------------------------------ */

        if (
          currentStatus ===
          targetStatus
        ) {
          return createAlreadyAppliedResult({
            resource:
              currentResource,

            action,

            targetStatus,
          });
        }


        /* ------------------------------------------------------------------
           UN AUTRE CHANGEMENT A EU LIEU
           ------------------------------------------------------------------ */

        throwTransitionNotAllowed(
          currentStatus,
        );
      }


      /* --------------------------------------------------------------------
         RELECTURE APRÈS UPDATE
         -------------------------------------------------------------------- */

      const updatedResource =
        await findShipmentForMutation(
          tx,
          normalizedShipmentId,
          storeId,
        );


      if (
        !updatedResource
      ) {
        throw new ManagerShipmentMutationError(
          "MUTATION_FAILED",
          "Impossible de relire la livraison après sa mise à jour.",
        );
      }


      const updatedStatus =
        normalizeShipmentStatus(
          updatedResource.status,
        );


      if (
        updatedStatus !==
        targetStatus
      ) {
        throw new ManagerShipmentMutationError(
          "MUTATION_FAILED",
          "La livraison n’a pas atteint le statut attendu.",
        );
      }


      /* --------------------------------------------------------------------
         AUDIT
         --------------------------------------------------------------------
         
         L'audit est créé dans la même transaction que la mutation.
         
         Si l'audit échoue :
         
         la transaction entière échoue.
         
         Les notifications, elles, restent volontairement en dehors de cette
         transaction car une panne Resend / WhatsApp ne doit pas annuler une
         vraie livraison.
         -------------------------------------------------------------------- */

      await createShipmentAudit({
        tx,

        storeId,

        managerId,

        action,

        shipmentId:
          updatedResource.id,

        shipmentNumber:
          updatedResource
            .shipmentNumber,

        orderId:
          updatedResource
            .order
            .id,

        orderNumber:
          updatedResource
            .order
            .orderNumber,

        previousStatus:
          initialStatus,

        nextStatus:
          updatedStatus,
      });


      /* --------------------------------------------------------------------
         IMPORTANT — ORDER STATUS
         --------------------------------------------------------------------
         
         Cette première version NE modifie volontairement PAS :
         
         Order.status
         Order.deliveredAt
         Order.cancelledAt
         
         Pourquoi ?
         
         Une Order possède une relation :
         
         shipments Shipment[]
         
         donc une même commande peut potentiellement avoir plusieurs
         livraisons.
         
         Sans règle métier officielle déjà vérifiée indiquant qu'une seule
         livraison DELIVERED suffit pour faire passer toute la commande à
         DELIVERED, nous ne créons pas cette règle artificiellement.
         
         Cette synchronisation pourra être ajoutée uniquement lorsque la règle
         officielle du projet sera fixée.
         -------------------------------------------------------------------- */


      /* --------------------------------------------------------------------
         RESULT
         -------------------------------------------------------------------- */

      return {
        outcome:
          "UPDATED",

        action,

        changed:
          true,

        shipmentId:
          updatedResource.id,

        shipmentNumber:
          updatedResource
            .shipmentNumber,

        orderId:
          updatedResource
            .order
            .id,

        orderNumber:
          updatedResource
            .order
            .orderNumber,

        previousStatus:
          initialStatus,

        status:
          updatedStatus,

        deliveredAt:
          serializeDate(
            updatedResource
              .deliveredAt,
          ),

        notification:
          createNotificationContext(
            updatedResource,
          ),
      };
    },
  );
}


/* ==========================================================================
   CONFIRMER LA LIVRAISON
   ========================================================================== */

/**
 * Confirme réellement la livraison.
 *
 * Effets DB :
 *
 * Shipment.status
 *   -> DELIVERED
 *
 * Shipment.deliveredAt
 *   -> date serveur
 *
 * AuditLog
 *   -> DELIVERY_CONFIRMED dans metadata.event
 *
 * Les notifications ne sont PAS envoyées ici.
 */

export async function confirmManagerShipment(
  shipmentId:
    string,
): Promise<ManagerShipmentMutationResult> {
  return executeManagerShipmentMutation({
    shipmentId,

    action:
      "confirm",
  });
}


/* ==========================================================================
   ANNULER LA LIVRAISON
   ========================================================================== */

/**
 * Annule réellement la livraison.
 *
 * Effets DB :
 *
 * Shipment.status
 *   -> CANCELLED
 *
 * AuditLog
 *   -> DELIVERY_CANCELLED dans metadata.event
 *
 * Shipment ne possède actuellement aucun cancelledAt.
 *
 * Nous n'en inventons donc pas.
 *
 * Les notifications ne sont PAS envoyées ici.
 */

export async function cancelManagerShipment(
  shipmentId:
    string,
): Promise<ManagerShipmentMutationResult> {
  return executeManagerShipmentMutation({
    shipmentId,

    action:
      "cancel",
  });
}


/* ==========================================================================
   TYPE GUARD ERROR
   ========================================================================== */

export function isManagerShipmentMutationError(
  error:
    unknown,
): error is ManagerShipmentMutationError {
  return (
    error instanceof
    ManagerShipmentMutationError
  );
}