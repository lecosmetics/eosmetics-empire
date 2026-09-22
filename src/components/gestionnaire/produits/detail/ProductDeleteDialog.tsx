"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  deleteProductAction,
} from "@/lib/gestionnaire/produits/detail/product-detail-actions";

import {
  INITIAL_PRODUCT_DELETE_ACTION_STATE,
  isValidProductDetailId,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — CONFIRMATION DE SUPPRESSION DÉFINITIVE PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDeleteDialog.tsx
 *
 * RESPONSABILITÉS :
 *
 * - empêcher une suppression accidentelle ;
 * - afficher clairement le produit concerné ;
 * - expliquer clairement les conséquences de la suppression définitive ;
 * - envoyer uniquement productId au Server Action ;
 * - ne jamais envoyer storeId ou managerId ;
 * - empêcher les doubles soumissions ;
 * - afficher les erreurs retournées par le serveur ;
 * - gérer correctement le focus clavier ;
 * - enfermer le focus dans la modale ;
 * - gérer Escape ;
 * - gérer le clic sur l'overlay ;
 * - bloquer le scroll pendant l'ouverture ;
 * - empêcher la fermeture pendant une suppression ;
 * - rediriger vers la liste des produits après succès.
 *
 *
 * SÉCURITÉ :
 *
 * Ce composant Client n'autorise jamais lui-même une suppression.
 *
 * La décision finale reste exclusivement côté serveur dans :
 *
 * product-detail-actions.ts
 *
 * Le serveur revérifie notamment :
 *
 * - la session Gestionnaire ;
 * - la boutique authentifiée ;
 * - l'appartenance du produit ;
 * - l'origine STORE / CATALOG ;
 * - la boutique créatrice ;
 * - l'absence de partage du Product avec une autre boutique ;
 * - les conditions nécessaires à la suppression transactionnelle.
 *
 *
 * SUPPRESSION DÉFINITIVE :
 *
 * Lorsqu'elle est autorisée, l'action serveur :
 *
 * - conserve les anciennes commandes ;
 * - conserve les OrderItem historiques ;
 * - détache leur référence StoreProduct ;
 * - supprime les mouvements de stock du produit ;
 * - supprime le StoreProduct ;
 * - supprime les ProductImage en base ;
 * - supprime le Product ;
 * - nettoie les fichiers Storage lorsque leur chemin est identifiable.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDeleteDialogProps {
  readonly productId:
    string;

  readonly productName:
    string;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


/* ==========================================================================
   NORMALISATION
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


function normalizeProductId(
  value:
    string,
): string | null {
  const normalized =
    value.trim();


  if (
    !isValidProductDetailId(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   FOCUSABLE ELEMENTS
   ========================================================================== */

const FOCUSABLE_ELEMENTS_SELECTOR =
  [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(
    ",",
  );


function getFocusableElements(
  container:
    HTMLElement,
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      FOCUSABLE_ELEMENTS_SELECTOR,
    ),
  ).filter(
    (
      element,
    ) => {
      if (
        element.getAttribute(
          "aria-hidden",
        ) ===
        "true"
      ) {
        return false;
      }


      if (
        element.getAttribute(
          "aria-disabled",
        ) ===
        "true"
      ) {
        return false;
      }


      return true;
    },
  );
}


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function ProductDeleteDialog({
  productId,
  productName,
}: ProductDeleteDialogProps) {
  /* =========================================================================
     ROUTER
     ========================================================================= */

  const router =
    useRouter();


  /* =========================================================================
     IDS ACCESSIBILITÉ
     ========================================================================= */

  const dialogId =
    useId();


  const titleId =
    useId();


  const descriptionId =
    useId();


  const warningId =
    useId();


  const errorId =
    useId();


  /* =========================================================================
     ÉTAT LOCAL
     ========================================================================= */

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     SERVER ACTION
     ========================================================================= */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      deleteProductAction,
      INITIAL_PRODUCT_DELETE_ACTION_STATE,
    );


  /* =========================================================================
     REFS
     ========================================================================= */

  const triggerRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  const dialogRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const cancelButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  const deletionCompletedRef =
    useRef(
      false,
    );


  /* =========================================================================
     DONNÉES NORMALISÉES
     ========================================================================= */

  const safeProductName =
    normalizeProductName(
      productName,
    );


  const safeProductId =
    normalizeProductId(
      productId,
    );


  const hasValidProductId =
    safeProductId !==
    null;


  const hasServerError =
    state.status ===
    "error";


  const deletionSucceeded =
    state.status ===
    "success";


  const serverErrorMessage =
    hasServerError &&
    typeof state.message ===
      "string"
      ? state.message.trim()
      : "";


  /* =========================================================================
     RESTAURATION DU FOCUS
     ========================================================================= */

  const restoreTriggerFocus =
    useCallback(
      () => {
        window.requestAnimationFrame(
          () => {
            triggerRef.current
              ?.focus();
          },
        );
      },
      [],
    );


  /* =========================================================================
     OUVERTURE
     ========================================================================= */

  function openDialog() {
    if (
      isPending ||
      !hasValidProductId
    ) {
      return;
    }


    setIsOpen(
      true,
    );
  }


  /* =========================================================================
     FERMETURE
     ========================================================================= */

  const closeDialog =
    useCallback(
      () => {
        /**
         * Une suppression déjà envoyée au serveur ne peut plus être
         * masquée ou interrompue visuellement.
         */
        if (
          isPending
        ) {
          return;
        }


        setIsOpen(
          false,
        );


        restoreTriggerFocus();
      },
      [
        isPending,
        restoreTriggerFocus,
      ],
    );


  /* =========================================================================
     REDIRECTION APRÈS SUCCÈS
     ========================================================================= */

  useEffect(
    () => {
      if (
        !deletionSucceeded ||
        deletionCompletedRef
          .current
      ) {
        return;
      }


      deletionCompletedRef.current =
        true;


      /**
       * Le Server Action a déjà terminé la transaction et revalidé
       * les routes concernées.
       *
       * On revient simplement vers la liste réelle des produits.
       *
       * Aucun setState n'est nécessaire ici :
       * la navigation retire naturellement cette fiche supprimée.
       */

      router.replace(
        PRODUCTS_ROUTE,
      );


      router.refresh();
    },
    [
      deletionSucceeded,
      router,
    ],
  );


  /* =========================================================================
     FOCUS INITIAL
     ========================================================================= */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      const animationFrame =
        window.requestAnimationFrame(
          () => {
            cancelButtonRef.current
              ?.focus();
          },
        );


      return () => {
        window.cancelAnimationFrame(
          animationFrame,
        );
      };
    },
    [
      isOpen,
    ],
  );


  /* =========================================================================
     BLOCAGE DU SCROLL
     ========================================================================= */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      const body =
        document.body;


      const previousOverflow =
        body.style.overflow;


      const previousPaddingRight =
        body.style.paddingRight;


      const scrollbarWidth =
        window.innerWidth -
        document.documentElement
          .clientWidth;


      body.style.overflow =
        "hidden";


      if (
        scrollbarWidth >
        0
      ) {
        body.style.paddingRight =
          `${scrollbarWidth}px`;
      }


      return () => {
        body.style.overflow =
          previousOverflow;


        body.style.paddingRight =
          previousPaddingRight;
      };
    },
    [
      isOpen,
    ],
  );


  /* =========================================================================
     CLAVIER / FOCUS TRAP
     ========================================================================= */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      function handleKeyDown(
        event:
          KeyboardEvent,
      ) {
        const dialog =
          dialogRef.current;


        if (
          !dialog
        ) {
          return;
        }


        /* ------------------------------------------------------------------
           ESCAPE
           ------------------------------------------------------------------ */

        if (
          event.key ===
          "Escape"
        ) {
          event.preventDefault();


          closeDialog();


          return;
        }


        /* ------------------------------------------------------------------
           TAB
           ------------------------------------------------------------------ */

        if (
          event.key !==
          "Tab"
        ) {
          return;
        }


        const focusableElements =
          getFocusableElements(
            dialog,
          );


        if (
          focusableElements.length ===
          0
        ) {
          event.preventDefault();


          dialog.focus();


          return;
        }


        const firstElement =
          focusableElements[
            0
          ];


        const lastElement =
          focusableElements[
            focusableElements.length -
              1
          ];


        const activeElement =
          document.activeElement;


        /* ------------------------------------------------------------------
           SHIFT + TAB
           ------------------------------------------------------------------ */

        if (
          event.shiftKey
        ) {
          if (
            activeElement ===
              firstElement ||
            activeElement ===
              dialog ||
            !dialog.contains(
              activeElement,
            )
          ) {
            event.preventDefault();


            lastElement.focus();
          }


          return;
        }


        /* ------------------------------------------------------------------
           TAB NORMAL
           ------------------------------------------------------------------ */

        if (
          activeElement ===
            lastElement ||
          !dialog.contains(
            activeElement,
          )
        ) {
          event.preventDefault();


          firstElement.focus();
        }
      }


      document.addEventListener(
        "keydown",
        handleKeyDown,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      closeDialog,
      isOpen,
    ],
  );


  /* =========================================================================
     ARIA DESCRIBEDBY
     ========================================================================= */

  const describedBy =
    [
      descriptionId,
      warningId,
      hasServerError &&
      serverErrorMessage
        ? errorId
        : null,
    ]
      .filter(
        (
          value,
        ): value is string =>
          typeof value ===
            "string" &&
          value.length >
            0,
      )
      .join(
        " ",
      );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <>
      {/* ====================================================================
          DÉCLENCHEUR
          ==================================================================== */}

      <button
        ref={triggerRef}
        type="button"
        className="productDeleteDialogTrigger"
        onClick={
          openDialog
        }
        disabled={
          isPending ||
          !hasValidProductId
        }
        aria-haspopup="dialog"
        aria-expanded={
          isOpen
        }
        aria-controls={
          isOpen
            ? dialogId
            : undefined
        }
        title={
          hasValidProductId
            ? `Supprimer définitivement ${safeProductName}`
            : "Suppression indisponible"
        }
      >
        <Trash2
          size={18}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Supprimer le produit
        </span>
      </button>


      {/* ====================================================================
          MODALE
          ==================================================================== */}

      {isOpen ? (
        <div
          className="productDeleteDialogOverlay"
          role="presentation"
          onMouseDown={
            (
              event,
            ) => {
              /**
               * La fermeture par l'overlay intervient uniquement lorsque
               * l'utilisateur clique directement sur celui-ci.
               */

              if (
                event.target !==
                event.currentTarget
              ) {
                return;
              }


              closeDialog();
            }
          }
        >
          <div
            ref={dialogRef}
            id={dialogId}
            className="productDeleteDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              titleId
            }
            aria-describedby={
              describedBy
            }
            aria-busy={
              isPending
            }
            tabIndex={-1}
          >
            {/* ==============================================================
                HEADER
                ============================================================== */}

            <div className="productDeleteDialogHeader">
              <div
                className="productDeleteDialogWarningIcon"
                aria-hidden="true"
              >
                <TriangleAlert
                  size={28}
                  strokeWidth={1.85}
                />
              </div>


              <div className="productDeleteDialogHeaderContent">
                <span className="productDeleteDialogEyebrow">
                  Confirmation requise
                </span>


                <h2
                  id={titleId}
                  className="productDeleteDialogTitle"
                >
                  Supprimer définitivement ce produit ?
                </h2>
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
                aria-label="Fermer la fenêtre de confirmation"
                title="Fermer"
              >
                <X
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </div>


            {/* ==============================================================
                BODY
                ============================================================== */}

            <div className="productDeleteDialogBody">
              {/* ============================================================
                  DESCRIPTION
                  ============================================================ */}

              <p
                id={descriptionId}
                className="productDeleteDialogDescription"
              >
                Vous êtes sur le point de supprimer définitivement{" "}
                <strong>
                  {safeProductName}
                </strong>
                . Cette opération est irréversible une fois validée par le
                serveur.
              </p>


              {/* ============================================================
                  PRODUIT
                  ============================================================ */}

              <div className="productDeleteDialogProduct">
                <div
                  className="productDeleteDialogProductIcon"
                  aria-hidden="true"
                >
                  <Trash2
                    size={18}
                    strokeWidth={1.9}
                  />
                </div>


                <div className="productDeleteDialogProductContent">
                  <span className="productDeleteDialogProductLabel">
                    Produit concerné
                  </span>


                  <strong
                    className="productDeleteDialogProductName"
                    title={
                      safeProductName
                    }
                  >
                    {safeProductName}
                  </strong>
                </div>
              </div>


              {/* ============================================================
                  AVERTISSEMENT SUPPRESSION DÉFINITIVE
                  ============================================================ */}

              <div
                id={warningId}
                className="productDeleteDialogWarning"
              >
                <span
                  className="productDeleteDialogWarningSmallIcon"
                  aria-hidden="true"
                >
                  <TriangleAlert
                    size={18}
                    strokeWidth={1.9}
                  />
                </span>


                <div className="productDeleteDialogWarningContent">
                  <strong className="productDeleteDialogWarningTitle">
                    Suppression définitive
                  </strong>


                  <p className="productDeleteDialogWarningText">
                    La fiche produit, son stock actuel et les mouvements de
                    stock associés seront supprimés définitivement. Les
                    anciennes commandes restent conservées avec leurs
                    informations historiques de produit, quantité et montant.
                  </p>
                </div>
              </div>


              {/* ============================================================
                  ERREUR SERVEUR
                  ============================================================ */}

              {hasServerError &&
              serverErrorMessage ? (
                <div
                  id={errorId}
                  className="productDeleteDialogError"
                  role="alert"
                  aria-live="assertive"
                >
                  <span
                    className="productDeleteDialogErrorIcon"
                    aria-hidden="true"
                  >
                    <AlertCircle
                      size={18}
                      strokeWidth={2}
                    />
                  </span>


                  <div className="productDeleteDialogErrorContent">
                    <strong className="productDeleteDialogErrorTitle">
                      Suppression impossible
                    </strong>


                    <p className="productDeleteDialogErrorText">
                      {serverErrorMessage}
                    </p>
                  </div>
                </div>
              ) : null}


              {/* ============================================================
                  SÉCURITÉ
                  ============================================================ */}

              <div className="productDeleteDialogSecurity">
                <span
                  className="productDeleteDialogSecurityIcon"
                  aria-hidden="true"
                >
                  <ShieldCheck
                    size={18}
                    strokeWidth={1.9}
                  />
                </span>


                <p className="productDeleteDialogSecurityText">
                  Le navigateur transmet uniquement l’identifiant du produit.
                  Votre identité Gestionnaire et votre boutique sont récupérées
                  depuis la session sécurisée côté serveur. Un produit du
                  catalogue officiel, appartenant à une autre boutique ou
                  encore partagé ne pourra pas être supprimé par cette action.
                </p>
              </div>
            </div>


            {/* ==============================================================
                FORMULAIRE
                ============================================================== */}

            <form
              action={
                formAction
              }
              className="productDeleteDialogFooter"
            >
              {/* ============================================================
                  PRODUCT ID
                  ============================================================ */}

              {safeProductId ? (
                <input
                  type="hidden"
                  name="productId"
                  value={
                    safeProductId
                  }
                />
              ) : null}


              {/* ============================================================
                  ANNULER
                  ============================================================ */}

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


              {/* ============================================================
                  CONFIRMER
                  ============================================================ */}

              <button
                type="submit"
                className="productDeleteDialogConfirm"
                disabled={
                  isPending ||
                  !safeProductId
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                      className="productDeleteDialogSpinner"
                      aria-hidden="true"
                    />

                    <span>
                      Suppression définitive…
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2
                      size={18}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Supprimer définitivement
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}