"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  deleteGestionnaireProductAction,
} from "@/app/gestionnaire/(espace-prive)/produits/actions";

import type {
  DeleteGestionnaireProductActionState,
} from "@/app/gestionnaire/(espace-prive)/produits/actions";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * BOUTON SUPPRESSION PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/list/ProductDeleteButton.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le bouton Supprimer ;
 * - ne jamais supprimer immédiatement au clic ;
 * - ouvrir une confirmation accessible ;
 * - rappeler clairement le produit concerné ;
 * - envoyer uniquement productId à la Server Action ;
 * - laisser le serveur déterminer storeId / managerId ;
 * - empêcher les doubles soumissions ;
 * - afficher une erreur métier propre ;
 * - fermer la confirmation après réussite ;
 * - rafraîchir la liste après réussite.
 *
 * IMPORTANT :
 *
 * Ce composant ne reçoit volontairement PAS :
 *
 * - storeId ;
 * - managerId ;
 * - qrToken ;
 * - statut à appliquer ;
 * - permission supposée depuis le navigateur.
 *
 * Le navigateur transmet uniquement :
 *
 * productId
 *
 * L'autorisation réelle est recalculée côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface ProductDeleteButtonProps {
  productId:
    string;

  productName:
    string;
}


/* ==========================================================================
   INITIAL ACTION STATE
   ========================================================================== */

const INITIAL_DELETE_STATE:
  DeleteGestionnaireProductActionState = {
    status:
      "idle",

    message:
      null,

    productId:
      null,
  };


/* ==========================================================================
   NORMALISATION DU NOM
   ========================================================================== */

function normalizeProductName(
  value:
    string,
): string {
  const normalized =
    value.trim();


  return normalized ||
    "ce produit";
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProductDeleteButton({
  productId,
  productName,
}: ProductDeleteButtonProps) {
  /* ------------------------------------------------------------------------
     ROUTER
     ------------------------------------------------------------------------ */

  const router =
    useRouter();


  /* ------------------------------------------------------------------------
     IDENTIFIANT ACCESSIBLE UNIQUE
     ------------------------------------------------------------------------ */

  const reactId =
    useId();


  const safeId =
    reactId.replace(
      /:/g,
      "",
    );


  const dialogId =
    `delete-product-dialog-${safeId}`;


  const dialogTitleId =
    `${dialogId}-title`;


  const dialogDescriptionId =
    `${dialogId}-description`;


  const dialogErrorId =
    `${dialogId}-error`;


  /* ------------------------------------------------------------------------
     REFS
     ------------------------------------------------------------------------ */

  const dialogRef =
    useRef<HTMLDialogElement | null>(
      null,
    );


  const triggerButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  const cancelButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  /* ------------------------------------------------------------------------
     ACTION
     ------------------------------------------------------------------------ */

  const [
    actionState,
    formAction,
    isPending,
  ] =
    useActionState(
      deleteGestionnaireProductAction,
      INITIAL_DELETE_STATE,
    );


  /* ------------------------------------------------------------------------
     DONNÉES D'AFFICHAGE
     ------------------------------------------------------------------------ */

  const normalizedProductName =
    normalizeProductName(
      productName,
    );


  /* ------------------------------------------------------------------------
     OUVERTURE
     ------------------------------------------------------------------------ */

  function openDialog():
    void {
    const dialog =
      dialogRef.current;


    if (
      !dialog ||
      dialog.open
    ) {
      return;
    }


    dialog.showModal();


    /*
     * showModal() place généralement le focus automatiquement.
     *
     * On cible malgré tout explicitement Annuler afin que l'action
     * destructive ne soit jamais le premier choix au clavier.
     */

    window.requestAnimationFrame(
      () => {
        cancelButtonRef
          .current
          ?.focus();
      },
    );
  }


  /* ------------------------------------------------------------------------
     FERMETURE
     ------------------------------------------------------------------------ */

  function closeDialog():
    void {
    if (
      isPending
    ) {
      /*
       * Pendant la suppression, on évite que l'utilisateur ferme
       * accidentellement la boîte et pense que l'action a été annulée.
       */

      return;
    }


    const dialog =
      dialogRef.current;


    if (
      !dialog ||
      !dialog.open
    ) {
      return;
    }


    dialog.close();


    window.requestAnimationFrame(
      () => {
        triggerButtonRef
          .current
          ?.focus();
      },
    );
  }


  /* ------------------------------------------------------------------------
     ESCAPE / CANCEL NATIF
     ------------------------------------------------------------------------ */

  function handleDialogCancel(
    event:
      React.SyntheticEvent<HTMLDialogElement>,
  ): void {
    if (
      isPending
    ) {
      event.preventDefault();

      return;
    }


    /*
     * Le navigateur fermera ensuite le <dialog> normalement.
     */

    window.requestAnimationFrame(
      () => {
        triggerButtonRef
          .current
          ?.focus();
      },
    );
  }


  /* ------------------------------------------------------------------------
     SUCCÈS
     ------------------------------------------------------------------------
     Après réussite :
     
     - la Server Action a déjà revalidé les routes ;
     - on ferme la confirmation ;
     - router.refresh() garantit que la liste client reflète immédiatement
       les nouvelles données.
     ------------------------------------------------------------------------ */

  useEffect(
    () => {
      if (
        actionState.status !==
          "success" ||
        actionState.productId !==
          productId
      ) {
        return;
      }


      const dialog =
        dialogRef.current;


      if (
        dialog?.open
      ) {
        dialog.close();
      }


      router.refresh();
    },
    [
      actionState,
      productId,
      router,
    ],
  );


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <>
      {/* ================================================================
          BOUTON SUPPRIMER
          ================================================================ */}

      <button
        ref={
          triggerButtonRef
        }
        type="button"
        className="productDeleteTrigger"
        onClick={
          openDialog
        }
        aria-haspopup="dialog"
        aria-controls={
          dialogId
        }
        aria-label={
          `Supprimer ${normalizedProductName}`
        }
      >
        <Trash2
          size={16}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Supprimer
        </span>
      </button>


      {/* ================================================================
          CONFIRMATION
          ================================================================ */}

      <dialog
        ref={
          dialogRef
        }
        id={
          dialogId
        }
        className="productDeleteDialog"
        aria-labelledby={
          dialogTitleId
        }
        aria-describedby={
          dialogDescriptionId
        }
        onCancel={
          handleDialogCancel
        }
      >
        <div className="productDeleteDialogPanel">
          {/* ------------------------------------------------------------
              HEADER
              ------------------------------------------------------------ */}

          <div className="productDeleteDialogHeader">
            <div className="productDeleteDialogIcon">
              <TriangleAlert
                size={22}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>


            <button
              type="button"
              className="productDeleteDialogClose"
              onClick={
                closeDialog
              }
              disabled={
                isPending
              }
              aria-label="Fermer la confirmation"
            >
              <X
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </button>
          </div>


          {/* ------------------------------------------------------------
              CONTENT
              ------------------------------------------------------------ */}

          <div className="productDeleteDialogContent">
            <h2
              id={
                dialogTitleId
              }
              className="productDeleteDialogTitle"
            >
              Supprimer ce produit ?
            </h2>


            <p
              id={
                dialogDescriptionId
              }
              className="productDeleteDialogDescription"
            >
              Cette action retirera le produit de votre espace
              Gestionnaire et il ne sera plus disponible selon
              les règles de la plateforme.
            </p>


            <div className="productDeleteDialogProduct">
              <span className="productDeleteDialogProductLabel">
                Produit concerné
              </span>

              <strong>
                {normalizedProductName}
              </strong>
            </div>


            <div className="productDeleteDialogNotice">
              <TriangleAlert
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <p>
                Les informations historiques liées aux commandes,
                au stock et au QR Code sont protégées par les règles
                serveur de la plateforme.
              </p>
            </div>


            {/* ----------------------------------------------------------
                ERREUR ACTION
                ---------------------------------------------------------- */}

            {actionState.status ===
              "error" &&
            actionState.message ? (
              <div
                id={
                  dialogErrorId
                }
                className="productDeleteDialogError"
                role="alert"
                aria-live="assertive"
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {actionState.message}
                </span>
              </div>
            ) : null}
          </div>


          {/* ------------------------------------------------------------
              ACTIONS
              ------------------------------------------------------------ */}

          <form
            action={
              formAction
            }
            className="productDeleteDialogActions"
            aria-describedby={
              actionState.status ===
                "error"
                ? dialogErrorId
                : undefined
            }
          >
            {/*
             * productId est uniquement une cible.
             *
             * Il ne constitue jamais une preuve d'autorisation.
             *
             * La Server Action recalcule :
             *
             * - la session ;
             * - le managerId ;
             * - le storeId ;
             * - l'appartenance réelle du produit.
             */}

            <input
              type="hidden"
              name="productId"
              value={
                productId
              }
            />


            <button
              ref={
                cancelButtonRef
              }
              type="button"
              className="productDeleteDialogCancel"
              onClick={
                closeDialog
              }
              disabled={
                isPending
              }
            >
              Annuler
            </button>


            <button
              type="submit"
              className="productDeleteDialogConfirm"
              disabled={
                isPending
              }
              aria-disabled={
                isPending
              }
            >
              <Trash2
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                {isPending
                  ? "Suppression…"
                  : "Supprimer"}
              </span>
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}