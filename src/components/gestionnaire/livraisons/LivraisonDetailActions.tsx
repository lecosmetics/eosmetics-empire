"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  CheckCircle2,
  Info,
  LoaderCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  cancelDeliveryAction,
  confirmDeliveryAction,
} from "@/app/gestionnaire/(espace-prive)/livraisons/[deliveryId]/actions";

import {
  INITIAL_MANAGER_SHIPMENT_ACTION_STATE,
  getManagerShipmentStatusLabel,
  type ManagerShipmentActionState,
  type ManagerShipmentAuthorizedActions,
  type ManagerShipmentStatus,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — ACTIONS LIVRAISON
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonDetailActions.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher uniquement les actions autorisées ;
 * - demander confirmation avant toute mutation ;
 * - appeler les Server Actions officielles ;
 * - empêcher les doubles soumissions côté interface ;
 * - afficher les erreurs métier retournées par le serveur ;
 * - afficher la réussite d'une action ;
 * - rafraîchir les données serveur après une mutation réussie.
 *
 *
 * ACTIONS AUTORISÉES :
 *
 * 1. Confirmer la livraison
 * 2. Annuler la livraison
 *
 *
 * CE COMPOSANT NE :
 *
 * - ne modifie jamais directement Prisma ;
 * - ne décide jamais seul d'une transition métier ;
 * - ne contacte jamais Resend directement ;
 * - ne contacte jamais Meta directement ;
 * - ne fait jamais confiance au statut affiché dans le navigateur ;
 * - ne remplace jamais les contrôles serveur.
 *
 *
 * Le serveur reste l'autorité finale :
 *
 * Client
 *   ↓
 * Server Action
 *   ↓
 * shipment-mutation.ts
 *   ↓
 * transaction Prisma
 *   ↓
 * shipment-notifications.ts
 *   ↓
 * Resend / Meta
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonDetailActionsProps {
  readonly shipmentId:
    string;

  readonly shipmentNumber:
    string;

  readonly currentStatus:
    ManagerShipmentStatus;

  readonly authorizedActions:
    ManagerShipmentAuthorizedActions;
}


/* ==========================================================================
   INITIAL STATES
   ========================================================================== */

function createInitialActionState():
  ManagerShipmentActionState {
  return {
    ...INITIAL_MANAGER_SHIPMENT_ACTION_STATE,
  };
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonDetailActions({
  shipmentId,
  shipmentNumber,
  currentStatus,
  authorizedActions,
}: LivraisonDetailActionsProps) {
  const router =
    useRouter();


  /* =========================================================================
     DIALOG REFS
     ========================================================================= */

  const confirmDialogRef =
    useRef<HTMLDialogElement>(
      null,
    );


  const cancelDialogRef =
    useRef<HTMLDialogElement>(
      null,
    );


  /* =========================================================================
     CONFIRM ACTION
     ========================================================================= */

  const [
    confirmState,
    confirmFormAction,
    confirmPending,
  ] =
    useActionState(
      confirmDeliveryAction,
      createInitialActionState(),
    );


  /* =========================================================================
     CANCEL ACTION
     ========================================================================= */

  const [
    cancelState,
    cancelFormAction,
    cancelPending,
  ] =
    useActionState(
      cancelDeliveryAction,
      createInitialActionState(),
    );


  /* =========================================================================
     GLOBAL PENDING
     ========================================================================= */

  const isPending =
    confirmPending ||
    cancelPending;


  /* =========================================================================
     AVAILABLE ACTIONS
     ========================================================================= */

  const hasAvailableAction =
    authorizedActions.canConfirm ||
    authorizedActions.canCancel;


  /* =========================================================================
     CONFIRM SUCCESS
     ========================================================================= */

  useEffect(
    () => {
      if (
        confirmState.status !==
          "success"
      ) {
        return;
      }


      confirmDialogRef
        .current
        ?.close();


      router.refresh();
    },
    [
      confirmState.status,
      router,
    ],
  );


  /* =========================================================================
     CANCEL SUCCESS
     ========================================================================= */

  useEffect(
    () => {
      if (
        cancelState.status !==
          "success"
      ) {
        return;
      }


      cancelDialogRef
        .current
        ?.close();


      router.refresh();
    },
    [
      cancelState.status,
      router,
    ],
  );


  /* =========================================================================
     OPEN CONFIRM DIALOG
     ========================================================================= */

  function openConfirmDialog():
    void {
    if (
      isPending ||
      !authorizedActions.canConfirm
    ) {
      return;
    }


    const dialog =
      confirmDialogRef.current;


    if (
      !dialog ||
      dialog.open
    ) {
      return;
    }


    dialog.showModal();
  }


  /* =========================================================================
     CLOSE CONFIRM DIALOG
     ========================================================================= */

  function closeConfirmDialog():
    void {
    if (
      confirmPending
    ) {
      return;
    }


    confirmDialogRef
      .current
      ?.close();
  }


  /* =========================================================================
     OPEN CANCEL DIALOG
     ========================================================================= */

  function openCancelDialog():
    void {
    if (
      isPending ||
      !authorizedActions.canCancel
    ) {
      return;
    }


    const dialog =
      cancelDialogRef.current;


    if (
      !dialog ||
      dialog.open
    ) {
      return;
    }


    dialog.showModal();
  }


  /* =========================================================================
     CLOSE CANCEL DIALOG
     ========================================================================= */

  function closeCancelDialog():
    void {
    if (
      cancelPending
    ) {
      return;
    }


    cancelDialogRef
      .current
      ?.close();
  }


  /* =========================================================================
     PREVENT CLOSE WHILE PENDING
     ========================================================================= */

  function preventConfirmDialogCancellation(
    event:
      React.SyntheticEvent<HTMLDialogElement>,
  ): void {
    if (
      confirmPending
    ) {
      event.preventDefault();
    }
  }


  function preventCancelDialogCancellation(
    event:
      React.SyntheticEvent<HTMLDialogElement>,
  ): void {
    if (
      cancelPending
    ) {
      event.preventDefault();
    }
  }


  /* =========================================================================
     SUCCESS MESSAGE
     ========================================================================= */

  const latestSuccessState =
    cancelState.status ===
      "success"
      ? cancelState
      : confirmState.status ===
          "success"
        ? confirmState
        : null;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={styles.livraisonDetailActions}
      aria-labelledby="livraison-detail-actions-title"
    >
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <div className={styles.livraisonDetailActionsHeader}>
        <div className={styles.livraisonDetailActionsHeading}>
          <span
            className={styles.livraisonDetailActionsIcon}
            aria-hidden="true"
          >
            <ShieldCheck
              size={20}
              strokeWidth={1.8}
            />
          </span>


          <div>
            <h2
              id="livraison-detail-actions-title"
              className={styles.livraisonDetailActionsTitle}
            >
              Gestion de la livraison
            </h2>


            <p className={styles.livraisonDetailActionsDescription}>
              Confirmez la remise de la commande ou annulez cette
              livraison lorsque cela est nécessaire.
            </p>
          </div>
        </div>


        <span className={styles.livraisonDetailActionsCurrentStatus}>
          Statut actuel :{" "}
          <strong>
            {getManagerShipmentStatusLabel(
              currentStatus,
            )}
          </strong>
        </span>
      </div>


      {/* ==================================================================
          SUCCESS
          ================================================================== */}

      <div
        className={styles.livraisonDetailActionMessages}
        aria-live="polite"
        aria-atomic="true"
      >
        {latestSuccessState?.message ? (
          <div
            className={styles.livraisonDetailActionSuccess}
            role="status"
          >
            <CheckCircle2
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              {latestSuccessState.message}
            </span>
          </div>
        ) : null}
      </div>


      {/* ==================================================================
          AVAILABLE ACTIONS
          ================================================================== */}

      {hasAvailableAction ? (
        <div className={styles.livraisonDetailActionsBody}>
          <div className={styles.livraisonDetailActionsNotice}>
            <Info
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <p>
              Toute action est vérifiée côté serveur avant la mise à jour
              de la livraison.
            </p>
          </div>


          <div className={styles.livraisonDetailActionsButtons}>
            {/* ============================================================
                CANCEL
                ============================================================ */}

            {authorizedActions.canCancel ? (
              <button
                type="button"
                className={styles.livraisonDetailCancelButton}
                onClick={openCancelDialog}
                disabled={isPending}
              >
                <XCircle
                  size={18}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Annuler la livraison
                </span>
              </button>
            ) : null}


            {/* ============================================================
                CONFIRM
                ============================================================ */}

            {authorizedActions.canConfirm ? (
              <button
                type="button"
                className={styles.livraisonDetailConfirmButton}
                onClick={openConfirmDialog}
                disabled={isPending}
              >
                <CheckCircle2
                  size={18}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Confirmer la livraison
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        /* ==================================================================
           NO ACTION AVAILABLE
           ================================================================== */

        <div className={styles.livraisonDetailNoActions}>
          <Info
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p>
            Aucune action supplémentaire n’est disponible pour une
            livraison au statut{" "}
            <strong>
              {getManagerShipmentStatusLabel(
                currentStatus,
              )}
            </strong>.
          </p>
        </div>
      )}


      {/* ==================================================================
          CONFIRM DELIVERY DIALOG
          ================================================================== */}

      <dialog
        ref={confirmDialogRef}
        className={styles.livraisonDetailDialog}
        onCancel={preventConfirmDialogCancellation}
      >
        <div className={styles.livraisonDetailDialogContent}>
          {/* ==============================================================
              ICON
              ============================================================== */}

          <div
            className={[
              styles.livraisonDetailDialogIcon,
              styles.livraisonDetailDialogIconSuccess,
            ].join(" ")}
            aria-hidden="true"
          >
            <CheckCircle2
              size={26}
              strokeWidth={1.8}
            />
          </div>


          {/* ==============================================================
              COPY
              ============================================================== */}

          <div className={styles.livraisonDetailDialogCopy}>
            <h2 className={styles.livraisonDetailDialogTitle}>
              Confirmer cette livraison ?
            </h2>


            <p className={styles.livraisonDetailDialogDescription}>
              Cette action indiquera que la commande a bien été remise
              à la cliente.
            </p>


            <div className={styles.livraisonDetailDialogReference}>
              <span>
                Livraison
              </span>

              <strong>
                {shipmentNumber}
              </strong>
            </div>
          </div>


          {/* ==============================================================
              SERVER ERROR
              ============================================================== */}

          <div
            className={styles.livraisonDetailDialogMessages}
            aria-live="polite"
            aria-atomic="true"
          >
            {confirmState.status ===
              "error" &&
            confirmState.message ? (
              <div
                className={styles.livraisonDetailActionError}
                role="alert"
              >
                <XCircle
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {confirmState.message}
                </span>
              </div>
            ) : null}
          </div>


          {/* ==============================================================
              FORM
              ============================================================== */}

          <form
            action={confirmFormAction}
            className={styles.livraisonDetailDialogActions}
          >
            <input
              type="hidden"
              name="shipmentId"
              value={shipmentId}
            />


            <button
              type="button"
              className={styles.livraisonDetailDialogSecondaryButton}
              onClick={closeConfirmDialog}
              disabled={confirmPending}
            >
              Annuler
            </button>


            <button
              type="submit"
              className={styles.livraisonDetailDialogConfirmButton}
              disabled={confirmPending}
            >
              {confirmPending ? (
                <>
                  <LoaderCircle
                    className={styles.livraisonDetailSpinner}
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Confirmation...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Confirmer
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </dialog>


      {/* ==================================================================
          CANCEL DELIVERY DIALOG
          ================================================================== */}

      <dialog
        ref={cancelDialogRef}
        className={styles.livraisonDetailDialog}
        onCancel={preventCancelDialogCancellation}
      >
        <div className={styles.livraisonDetailDialogContent}>
          {/* ==============================================================
              ICON
              ============================================================== */}

          <div
            className={[
              styles.livraisonDetailDialogIcon,
              styles.livraisonDetailDialogIconDanger,
            ].join(" ")}
            aria-hidden="true"
          >
            <XCircle
              size={26}
              strokeWidth={1.8}
            />
          </div>


          {/* ==============================================================
              COPY
              ============================================================== */}

          <div className={styles.livraisonDetailDialogCopy}>
            <h2 className={styles.livraisonDetailDialogTitle}>
              Annuler cette livraison ?
            </h2>


            <p className={styles.livraisonDetailDialogDescription}>
              La livraison sera marquée comme annulée et la cliente sera
              informée automatiquement par e-mail.
            </p>


            <div className={styles.livraisonDetailDialogReference}>
              <span>
                Livraison
              </span>

              <strong>
                {shipmentNumber}
              </strong>
            </div>
          </div>


          {/* ==============================================================
              SERVER ERROR
              ============================================================== */}

          <div
            className={styles.livraisonDetailDialogMessages}
            aria-live="polite"
            aria-atomic="true"
          >
            {cancelState.status ===
              "error" &&
            cancelState.message ? (
              <div
                className={styles.livraisonDetailActionError}
                role="alert"
              >
                <XCircle
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {cancelState.message}
                </span>
              </div>
            ) : null}
          </div>


          {/* ==============================================================
              FORM
              ============================================================== */}

          <form
            action={cancelFormAction}
            className={styles.livraisonDetailDialogActions}
          >
            <input
              type="hidden"
              name="shipmentId"
              value={shipmentId}
            />


            <button
              type="button"
              className={styles.livraisonDetailDialogSecondaryButton}
              onClick={closeCancelDialog}
              disabled={cancelPending}
            >
              Retour
            </button>


            <button
              type="submit"
              className={styles.livraisonDetailDialogDangerButton}
              disabled={cancelPending}
            >
              {cancelPending ? (
                <>
                  <LoaderCircle
                    className={styles.livraisonDetailSpinner}
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Annulation...
                  </span>
                </>
              ) : (
                <>
                  <XCircle
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Confirmer l’annulation
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </dialog>
    </section>
  );
}