"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  cancelManagerShipment,
  confirmManagerShipment,
  isManagerShipmentMutationError,
  type ManagerShipmentMutationResult,
} from "@/lib/gestionnaire/livraisons/shipment-mutation";

import {
  notifyManagerShipmentMutation,
  type ManagerShipmentNotificationReport,
} from "@/lib/gestionnaire/livraisons/shipment-notifications";

import {
  MANAGER_SHIPMENT_ID_MAX_LENGTH,
  type ManagerShipmentAction,
  type ManagerShipmentActionState,
  type ManagerShipmentStatus,
} from "@/lib/gestionnaire/livraisons/shipment-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — SERVER ACTIONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/[deliveryId]/actions.ts
 *
 * ACTIONS PUBLIQUES :
 *
 * - confirmDeliveryAction()
 * - cancelDeliveryAction()
 *
 *
 * FLUX CONFIRMATION :
 *
 * Client Component
 *      ↓
 * confirmDeliveryAction()
 *      ↓
 * confirmManagerShipment()
 *      ↓
 * transaction Prisma
 *      ↓
 * Shipment.status = DELIVERED
 * Shipment.deliveredAt = maintenant
 *      ↓
 * commit DB
 *      ↓
 * notifyManagerShipmentMutation()
 *      ↓
 * e-mail + WhatsApp
 *      ↓
 * revalidatePath()
 *
 *
 * FLUX ANNULATION :
 *
 * Client Component
 *      ↓
 * cancelDeliveryAction()
 *      ↓
 * cancelManagerShipment()
 *      ↓
 * transaction Prisma
 *      ↓
 * Shipment.status = CANCELLED
 *      ↓
 * commit DB
 *      ↓
 * notifyManagerShipmentMutation()
 *      ↓
 * e-mail
 *      ↓
 * revalidatePath()
 *
 *
 * IMPORTANT :
 *
 * - aucun storeId ne vient du navigateur ;
 * - aucun managerId ne vient du navigateur ;
 * - aucun statut cible ne vient du formulaire ;
 * - le navigateur ne décide jamais de la transition ;
 * - la mutation serveur revérifie l'ownership ;
 * - une panne de notification ne rollback jamais la mutation ;
 * - aucune donnée Payment n'est modifiée ici ;
 * - aucune donnée Order n'est modifiée ici ;
 * - aucune notification n'est envoyée deux fois lorsqu'une mutation
 *   retourne ALREADY_APPLIED.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   FORM FIELD
   ========================================================================== */

const SHIPMENT_ID_FIELD =
  "shipmentId";


/* ==========================================================================
   READ FORM DATA
   ========================================================================== */

function readFormDataString(
  formData:
    FormData,

  fieldName:
    string,
): string | null {
  const value =
    formData.get(
      fieldName,
    );


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
   SHIPMENT ID
   ========================================================================== */

function normalizeShipmentId(
  value:
    string | null,
): string | null {
  if (
    !value
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


  /**
   * Refuse les caractères de contrôle.
   *
   * Les vrais identifiants Prisma du projet ne nécessitent jamais
   * ces caractères.
   */
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
   ERROR STATE
   ========================================================================== */

function createErrorState({
  action,
  message,
  shipmentId = null,
  shipmentStatus = null,
}: {
  readonly action:
    ManagerShipmentAction;

  readonly message:
    string;

  readonly shipmentId?:
    string | null;

  readonly shipmentStatus?:
    ManagerShipmentStatus | null;
}): ManagerShipmentActionState {
  return {
    status:
      "error",

    action,

    message,

    shipmentId,

    shipmentStatus,
  };
}


/* ==========================================================================
   SUCCESS STATE
   ========================================================================== */

function createSuccessState({
  action,
  message,
  mutation,
}: {
  readonly action:
    ManagerShipmentAction;

  readonly message:
    string;

  readonly mutation:
    ManagerShipmentMutationResult;
}): ManagerShipmentActionState {
  return {
    status:
      "success",

    action,

    message,

    shipmentId:
      mutation.shipmentId,

    shipmentStatus:
      mutation.status,
  };
}


/* ==========================================================================
   BUSINESS ERROR MAPPING
   ========================================================================== */

function mapMutationError({
  error,
  action,
  shipmentId,
}: {
  readonly error:
    unknown;

  readonly action:
    ManagerShipmentAction;

  readonly shipmentId:
    string | null;
}): ManagerShipmentActionState | null {
  if (
    !isManagerShipmentMutationError(
      error,
    )
  ) {
    return null;
  }


  switch (
    error.code
  ) {
    case "INVALID_SHIPMENT_ID":
      return createErrorState({
        action,

        message:
          "L’identifiant de cette livraison est invalide.",

        shipmentId,
      });


    case "SHIPMENT_NOT_FOUND":
      return createErrorState({
        action,

        message:
          "Cette livraison est introuvable ou n’est plus accessible.",

        shipmentId,
      });


    case "TRANSITION_NOT_ALLOWED":
      return createErrorState({
        action,

        message:
          action ===
          "confirm"
            ? "Cette livraison ne peut plus être confirmée dans son état actuel."
            : "Cette livraison ne peut plus être annulée dans son état actuel.",

        shipmentId,
      });


    case "MUTATION_FAILED":
      return createErrorState({
        action,

        message:
          "La mise à jour de cette livraison n’a pas pu être enregistrée.",

        shipmentId,
      });
  }
}


/* ==========================================================================
   REVALIDATION
   ========================================================================== */

function revalidateDeliveryRoutes(
  shipmentId:
    string,
): void {
  /**
   * Liste :
   *
   * - KPI ;
   * - filtres ;
   * - tableau ;
   * - statut ;
   * - dates.
   */
  revalidatePath(
    LIVRAISONS_ROUTE,
  );


  /**
   * Fiche détail.
   */
  revalidatePath(
    `${LIVRAISONS_ROUTE}/${shipmentId}`,
  );
}


/* ==========================================================================
   NOTIFICATION ERROR LOG
   ========================================================================== */

/**
 * Une erreur inattendue de la couche notifications ne doit jamais :
 *
 * - remettre le Shipment dans son ancien état ;
 * - transformer une mutation réussie en échec métier.
 *
 * On journalise uniquement des identifiants internes.
 *
 * Aucun e-mail ou téléphone client n'est affiché ici.
 */

function logUnexpectedNotificationError({
  action,
  mutation,
  error,
}: {
  readonly action:
    ManagerShipmentAction;

  readonly mutation:
    ManagerShipmentMutationResult;

  readonly error:
    unknown;
}): void {
  console.error(
    "[Cosmetics Empire] Erreur inattendue après mutation d’une livraison.",
    {
      action,

      shipmentId:
        mutation.shipmentId,

      orderId:
        mutation.orderId,

      errorName:
        error instanceof
          Error
          ? error.name
          : "UnknownError",
    },
  );
}


/* ==========================================================================
   CONFIRMATION MESSAGE
   ========================================================================== */

function createConfirmSuccessMessage({
  mutation,
  notifications,
}: {
  readonly mutation:
    ManagerShipmentMutationResult;

  readonly notifications:
    ManagerShipmentNotificationReport | null;
}): string {
  /* ------------------------------------------------------------------------
     IDEMPOTENCE
     ------------------------------------------------------------------------ */

  if (
    mutation.outcome ===
      "ALREADY_APPLIED" ||
    !mutation.changed
  ) {
    return "Cette livraison était déjà confirmée.";
  }


  /* ------------------------------------------------------------------------
     NOTIFICATION ORCHESTRATOR FAILED
     ------------------------------------------------------------------------ */

  if (
    !notifications
  ) {
    return (
      "La livraison a bien été confirmée. " +
      "La mise à jour est enregistrée, mais les notifications n’ont pas pu être vérifiées."
    );
  }


  const emailSent =
    notifications.email.status ===
      "SENT";


  const whatsappSent =
    notifications.whatsapp.status ===
      "SENT";


  /* ------------------------------------------------------------------------
     BOTH SENT
     ------------------------------------------------------------------------ */

  if (
    emailSent &&
    whatsappSent
  ) {
    return (
      "La livraison a bien été confirmée. " +
      "La cliente a été notifiée par e-mail et WhatsApp."
    );
  }


  /* ------------------------------------------------------------------------
     EMAIL ONLY
     ------------------------------------------------------------------------ */

  if (
    emailSent &&
    !whatsappSent
  ) {
    return (
      "La livraison a bien été confirmée. " +
      "L’e-mail a été envoyé, mais la notification WhatsApp n’a pas pu être envoyée."
    );
  }


  /* ------------------------------------------------------------------------
     WHATSAPP ONLY
     ------------------------------------------------------------------------ */

  if (
    !emailSent &&
    whatsappSent
  ) {
    return (
      "La livraison a bien été confirmée. " +
      "La notification WhatsApp a été envoyée, mais l’e-mail n’a pas pu être envoyé."
    );
  }


  /* ------------------------------------------------------------------------
     NONE
     ------------------------------------------------------------------------ */

  return (
    "La livraison a bien été confirmée. " +
    "Les notifications n’ont pas pu être envoyées."
  );
}


/* ==========================================================================
   CANCELLATION MESSAGE
   ========================================================================== */

function createCancellationSuccessMessage({
  mutation,
  notifications,
}: {
  readonly mutation:
    ManagerShipmentMutationResult;

  readonly notifications:
    ManagerShipmentNotificationReport | null;
}): string {
  /* ------------------------------------------------------------------------
     IDEMPOTENCE
     ------------------------------------------------------------------------ */

  if (
    mutation.outcome ===
      "ALREADY_APPLIED" ||
    !mutation.changed
  ) {
    return "Cette livraison était déjà annulée.";
  }


  /* ------------------------------------------------------------------------
     NOTIFICATION ORCHESTRATOR FAILED
     ------------------------------------------------------------------------ */

  if (
    !notifications
  ) {
    return (
      "La livraison a bien été annulée. " +
      "La mise à jour est enregistrée, mais la notification par e-mail n’a pas pu être vérifiée."
    );
  }


  /* ------------------------------------------------------------------------
     EMAIL SENT
     ------------------------------------------------------------------------ */

  if (
    notifications.email.status ===
      "SENT"
  ) {
    return (
      "La livraison a bien été annulée. " +
      "La cliente a été notifiée automatiquement par e-mail."
    );
  }


  /* ------------------------------------------------------------------------
     EMAIL NOT SENT
     ------------------------------------------------------------------------ */

  return (
    "La livraison a bien été annulée. " +
    "La notification par e-mail n’a pas pu être envoyée."
  );
}


/* ==========================================================================
   NOTIFY SAFELY
   ========================================================================== */

async function notifyMutationSafely({
  mutation,
  action,
}: {
  readonly mutation:
    ManagerShipmentMutationResult;

  readonly action:
    ManagerShipmentAction;
}): Promise<ManagerShipmentNotificationReport | null> {
  try {
    return await notifyManagerShipmentMutation(
      mutation,
    );
  } catch (
    error
  ) {
    /**
     * IMPORTANT :
     *
     * La mutation Shipment est déjà commitée à ce stade.
     *
     * Une erreur externe :
     *
     * - Resend ;
     * - Meta ;
     * - réseau ;
     * - journalisation notification ;
     *
     * ne doit jamais transformer la mutation métier en rollback.
     */

    logUnexpectedNotificationError({
      action,

      mutation,

      error,
    });


    return null;
  }
}


/* ==========================================================================
   CONFIRM DELIVERY ACTION
   ========================================================================== */

/**
 * Signature compatible avec :
 *
 * useActionState(
 *   confirmDeliveryAction,
 *   initialState,
 * )
 *
 *
 * IMPORTANT :
 *
 * Le previousState n'est jamais utilisé comme autorité métier.
 *
 * Toute la décision est recalculée côté serveur.
 */

export async function confirmDeliveryAction(
  _previousState:
    ManagerShipmentActionState,

  formData:
    FormData,
): Promise<ManagerShipmentActionState> {
  const action:
    ManagerShipmentAction =
      "confirm";


  /* ------------------------------------------------------------------------
     1. SHIPMENT ID
     ------------------------------------------------------------------------ */

  const shipmentId =
    normalizeShipmentId(
      readFormDataString(
        formData,
        SHIPMENT_ID_FIELD,
      ),
    );


  if (
    !shipmentId
  ) {
    return createErrorState({
      action,

      message:
        "Impossible d’identifier correctement la livraison à confirmer.",
    });
  }


  /* ------------------------------------------------------------------------
     2. BUSINESS MUTATION
     ------------------------------------------------------------------------ */

  let mutation:
    ManagerShipmentMutationResult;


  try {
    mutation =
      await confirmManagerShipment(
        shipmentId,
      );
  } catch (
    error
  ) {
    /**
     * Nous interceptons UNIQUEMENT les erreurs métier contrôlées provenant
     * de shipment-mutation.ts.
     *
     * Les erreurs Next.js de redirection ne doivent pas être transformées
     * en faux message métier.
     */

    const mappedError =
      mapMutationError({
        error,

        action,

        shipmentId,
      });


    if (
      mappedError
    ) {
      return mappedError;
    }


    throw error;
  }


  /* ------------------------------------------------------------------------
     3. NOTIFICATIONS
     ------------------------------------------------------------------------
     
     Si changed === false :
     
     shipment-notifications.ts détecte ALREADY_APPLIED et n'envoie rien.
     ------------------------------------------------------------------------ */

  const notifications =
    await notifyMutationSafely({
      mutation,

      action,
    });


  /* ------------------------------------------------------------------------
     4. REVALIDATION
     ------------------------------------------------------------------------ */

  revalidateDeliveryRoutes(
    mutation.shipmentId,
  );


  /* ------------------------------------------------------------------------
     5. SUCCESS
     ------------------------------------------------------------------------ */

  return createSuccessState({
    action,

    mutation,

    message:
      createConfirmSuccessMessage({
        mutation,

        notifications,
      }),
  });
}


/* ==========================================================================
   CANCEL DELIVERY ACTION
   ========================================================================== */

/**
 * Signature compatible avec :
 *
 * useActionState(
 *   cancelDeliveryAction,
 *   initialState,
 * )
 *
 *
 * L'annulation :
 *
 * - met Shipment.status à CANCELLED ;
 * - ne crée aucun cancelledAt inexistant ;
 * - ne modifie aucun Payment ;
 * - ne modifie pas automatiquement Order ;
 * - déclenche uniquement l'e-mail prévu.
 */

export async function cancelDeliveryAction(
  _previousState:
    ManagerShipmentActionState,

  formData:
    FormData,
): Promise<ManagerShipmentActionState> {
  const action:
    ManagerShipmentAction =
      "cancel";


  /* ------------------------------------------------------------------------
     1. SHIPMENT ID
     ------------------------------------------------------------------------ */

  const shipmentId =
    normalizeShipmentId(
      readFormDataString(
        formData,
        SHIPMENT_ID_FIELD,
      ),
    );


  if (
    !shipmentId
  ) {
    return createErrorState({
      action,

      message:
        "Impossible d’identifier correctement la livraison à annuler.",
    });
  }


  /* ------------------------------------------------------------------------
     2. BUSINESS MUTATION
     ------------------------------------------------------------------------ */

  let mutation:
    ManagerShipmentMutationResult;


  try {
    mutation =
      await cancelManagerShipment(
        shipmentId,
      );
  } catch (
    error
  ) {
    const mappedError =
      mapMutationError({
        error,

        action,

        shipmentId,
      });


    if (
      mappedError
    ) {
      return mappedError;
    }


    /**
     * Les erreurs inattendues, y compris les interruptions internes Next.js
     * utilisées par redirect(), ne sont pas absorbées ici.
     */
    throw error;
  }


  /* ------------------------------------------------------------------------
     3. NOTIFICATION EMAIL
     ------------------------------------------------------------------------ */

  const notifications =
    await notifyMutationSafely({
      mutation,

      action,
    });


  /* ------------------------------------------------------------------------
     4. REVALIDATION
     ------------------------------------------------------------------------ */

  revalidateDeliveryRoutes(
    mutation.shipmentId,
  );


  /* ------------------------------------------------------------------------
     5. SUCCESS
     ------------------------------------------------------------------------ */

  return createSuccessState({
    action,

    mutation,

    message:
      createCancellationSuccessMessage({
        mutation,

        notifications,
      }),
  });
}