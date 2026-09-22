"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  Check,
  LoaderCircle,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";

import {
  usePublicPanier,
} from "@/components/public/panier/PublicPanierProvider";

import type {
  PublicAddToPanierButtonProps,
  PublicPanierMutationResult,
} from "@/lib/public/panier/public-panier-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * BOUTON — AJOUTER AU PANIER
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/panier/PublicAddToPanierButton.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Ajouter une offre StoreProduct au Panier public local.
 *
 * ============================================================================
 *
 * IDENTITÉ COMMERCIALE
 *
 * UNE ligne Panier =
 *
 * StoreProduct.id
 *
 * et NON :
 *
 * - Product.id ;
 * - Product.slug ;
 * - SKU ;
 * - nom du produit.
 *
 * ============================================================================
 *
 * DONNÉES AJOUTÉES AU PROVIDER :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * LE BOUTON NE TRANSMET PAS :
 *
 * - prix ;
 * - ancien prix ;
 * - devise ;
 * - stock ;
 * - nom produit ;
 * - boutique ;
 * - total.
 *
 * ============================================================================
 *
 * Ces informations seront relues côté serveur par :
 *
 * src/lib/public/panier/public-panier-actions.ts
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cliquer sur ce bouton :
 *
 * - ne réserve PAS le stock ;
 * - ne décrémente PAS le stock ;
 * - ne crée PAS de commande ;
 * - ne crée PAS de paiement ;
 * - ne contacte PAS Prisma ;
 * - ne contacte PAS PostgreSQL.
 *
 * Il modifie uniquement l'intention locale du Panier.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const ADD_TO_PANIER_SUCCESS_DURATION_MS =
  1800;


const PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH =
  191;


/* ==========================================================================
   2. ÉTATS VISUELS
   ========================================================================== */

type PublicAddToPanierFeedback =
  | "idle"
  | "added"
  | "error";


/* ==========================================================================
   3. ACCESSIBILITÉ
   ========================================================================== */

/**
 * Style inline volontairement limité au texte aria-live.
 *
 * Cela permet au composant de rester totalement fonctionnel avant même
 * la création de public-panier.module.css.
 */
const VISUALLY_HIDDEN_STYLE:
  CSSProperties = {
    position:
      "absolute",

    width:
      "1px",

    height:
      "1px",

    padding:
      0,

    margin:
      "-1px",

    overflow:
      "hidden",

    clip:
      "rect(0, 0, 0, 0)",

    whiteSpace:
      "nowrap",

    border:
      0,
  };


/* ==========================================================================
   4. NORMALISATION IDENTIFIANT
   ========================================================================== */

function normalizeStoreProductId(
  value:
    string,
): string |
  null {
  const normalized =
    value.trim();


  if (
    normalized.length ===
      0 ||
    normalized.length >
      PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   5. VALIDATION QUANTITÉ
   ========================================================================== */

function normalizeQuantity(
  value:
    number,
): number |
  null {
  if (
    !Number.isFinite(
      value,
    ) ||
    !Number.isSafeInteger(
      value,
    ) ||
    value <=
      0
  ) {
    return null;
  }


  return value;
}


/* ==========================================================================
   6. NORMALISATION LABEL
   ========================================================================== */

function normalizeLabel(
  value:
    string |
    undefined,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "Ajouter au panier";
  }


  const normalized =
    value.trim();


  return (
    normalized ||
    "Ajouter au panier"
  );
}


/* ==========================================================================
   7. MESSAGE D'ERREUR
   ========================================================================== */

function getMutationErrorMessage(
  result:
    PublicPanierMutationResult,
): string {
  if (
    result.success
  ) {
    return "";
  }


  switch (
    result.code
  ) {
    case "INVALID_STORE_PRODUCT_ID":
      return "Cette offre ne peut pas être ajoutée au panier.";


    case "INVALID_QUANTITY":
      return "La quantité demandée n’est pas valide.";


    case "ITEM_NOT_FOUND":
      return "Cette offre n’est plus présente dans le panier.";


    default:
      return "Impossible d’ajouter ce produit au panier.";
  }
}


/* ==========================================================================
   8. COMPOSANT
   ========================================================================== */

export default function PublicAddToPanierButton({
  storeProductId,
  quantity = 1,
  disabled = false,
  label,
  className,
}: PublicAddToPanierButtonProps) {
  const {
    state,
    actions,
  } =
    usePublicPanier();


  /* =========================================================================
     FEEDBACK
     ========================================================================= */

  const [
    feedback,
    setFeedback,
  ] =
    useState<
      PublicAddToPanierFeedback
    >(
      "idle",
    );


  const [
    feedbackMessage,
    setFeedbackMessage,
  ] =
    useState(
      "",
    );


  const feedbackTimerRef =
    useRef<
      ReturnType<typeof setTimeout> |
      null
    >(
      null,
    );


  /* =========================================================================
     NETTOYAGE TIMER
     ========================================================================= */

  useEffect(
    () => {
      return () => {
        if (
          feedbackTimerRef.current
        ) {
          clearTimeout(
            feedbackTimerRef.current,
          );


          feedbackTimerRef.current =
            null;
        }
      };
    },

    [],
  );


  /* =========================================================================
     DONNÉES NORMALISÉES
     ========================================================================= */

  const normalizedStoreProductId =
    useMemo(
      () =>
        normalizeStoreProductId(
          storeProductId,
        ),

      [
        storeProductId,
      ],
    );


  const normalizedQuantity =
    useMemo(
      () =>
        normalizeQuantity(
          quantity,
        ),

      [
        quantity,
      ],
    );


  const defaultLabel =
    useMemo(
      () =>
        normalizeLabel(
          label,
        ),

      [
        label,
      ],
    );


  /* =========================================================================
     QUANTITÉ ACTUELLEMENT DANS LE PANIER
     ========================================================================= */

  const currentQuantity =
    useMemo(
      () => {
        if (
          !normalizedStoreProductId
        ) {
          return 0;
        }


        return (
          state.items.find(
            (
              item,
            ) =>
              item
                .storeProductId ===
              normalizedStoreProductId,
          )?.quantity ??
          0
        );
      },

      [
        normalizedStoreProductId,
        state.items,
      ],
    );


  /* =========================================================================
     VALIDITÉ
     ========================================================================= */

  const hasValidInput =
    normalizedStoreProductId !==
      null &&
    normalizedQuantity !==
      null;


  const isHydrating =
    !state.hydrated;


  const isDisabled =
    disabled ||
    isHydrating ||
    !hasValidInput;


  /* =========================================================================
     RESET FEEDBACK
     ========================================================================= */

  function scheduleFeedbackReset():
    void {
    if (
      feedbackTimerRef.current
    ) {
      clearTimeout(
        feedbackTimerRef.current,
      );
    }


    feedbackTimerRef.current =
      setTimeout(
        () => {
          setFeedback(
            "idle",
          );


          setFeedbackMessage(
            "",
          );


          feedbackTimerRef.current =
            null;
        },

        ADD_TO_PANIER_SUCCESS_DURATION_MS,
      );
  }


  /* =========================================================================
     AJOUT
     ========================================================================= */

  function handleAddToPanier():
    void {
    if (
      isDisabled ||
      !normalizedStoreProductId ||
      normalizedQuantity ===
        null
    ) {
      return;
    }


    const result =
      actions.addItem({
        storeProductId:
          normalizedStoreProductId,

        quantity:
          normalizedQuantity,
      });


    /* ----------------------------------------------------------------------
       SUCCÈS
       ---------------------------------------------------------------------- */

    if (
      result.success
    ) {
      setFeedback(
        "added",
      );


      setFeedbackMessage(
        normalizedQuantity >
          1
          ? `${normalizedQuantity} articles ajoutés au panier.`
          : "Produit ajouté au panier.",
      );


      scheduleFeedbackReset();


      return;
    }


    /* ----------------------------------------------------------------------
       ERREUR
       ---------------------------------------------------------------------- */

    setFeedback(
      "error",
    );


    setFeedbackMessage(
      getMutationErrorMessage(
        result,
      ),
    );


    scheduleFeedbackReset();
  }


  /* =========================================================================
     LABEL VISUEL
     ========================================================================= */

  let visibleLabel =
    defaultLabel;


  if (
    isHydrating
  ) {
    visibleLabel =
      "Chargement…";
  } else if (
    feedback ===
    "added"
  ) {
    visibleLabel =
      "Ajouté au panier";
  } else if (
    feedback ===
    "error"
  ) {
    visibleLabel =
      "Réessayer";
  }


  /* =========================================================================
     ACCESSIBILITY LABEL
     ========================================================================= */

  const accessibleLabel =
    currentQuantity >
    0
      ? `${defaultLabel}. ${currentQuantity} déjà dans le panier.`
      : defaultLabel;


  /* =========================================================================
     RENDU
     ========================================================================= */

  return (
    <>
      <button
        type="button"
        className={
          className
        }
        disabled={
          isDisabled
        }
        onClick={
          handleAddToPanier
        }
        aria-label={
          accessibleLabel
        }
        aria-disabled={
          isDisabled
        }
        data-public-add-to-panier="true"
        data-store-product-id={
          normalizedStoreProductId ??
          ""
        }
        data-feedback={
          feedback
        }
        data-hydrated={
          state.hydrated
            ? "true"
            : "false"
        }
        data-in-panier={
          currentQuantity >
          0
            ? "true"
            : "false"
        }
        data-current-quantity={
          currentQuantity
        }
      >
        {/* ================================================================
            ICÔNE
            ================================================================ */}

        <span
          aria-hidden="true"
          data-public-add-to-panier-icon="true"
        >
          {isHydrating ? (
            <LoaderCircle
              size={
                18
              }
              strokeWidth={
                1.9
              }
            />
          ) : feedback ===
            "added" ? (
            <Check
              size={
                18
              }
              strokeWidth={
                2.1
              }
            />
          ) : feedback ===
            "error" ? (
            <TriangleAlert
              size={
                18
              }
              strokeWidth={
                1.9
              }
            />
          ) : (
            <ShoppingBag
              size={
                18
              }
              strokeWidth={
                1.9
              }
            />
          )}
        </span>


        {/* ================================================================
            LABEL
            ================================================================ */}

        <span
          data-public-add-to-panier-label="true"
        >
          {
            visibleLabel
          }
        </span>


        {/* ================================================================
            QUANTITÉ DÉJÀ AJOUTÉE
            ================================================================ */}

        {state.hydrated &&
        currentQuantity >
          0 &&
        feedback ===
          "idle" ? (
          <span
            aria-hidden="true"
            data-public-add-to-panier-quantity="true"
          >
            {
              currentQuantity
            }
          </span>
        ) : null}
      </button>


      {/* ==================================================================
          MESSAGE ACCESSIBLE
          ================================================================== */}

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={
          VISUALLY_HIDDEN_STYLE
        }
      >
        {
          feedbackMessage
        }
      </span>
    </>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * FLUX :
 *
 * PublicProductCard
 *
 * ou
 *
 * PublicProductDetail
 *
 *          ↓
 *
 * PublicAddToPanierButton
 *
 *          ↓
 *
 * actions.addItem({
 *   storeProductId,
 *   quantity
 * })
 *
 *          ↓
 *
 * PublicPanierProvider
 *
 *          ↓
 *
 * localStorage :
 *
 * {
 *   version: 1,
 *   items: [
 *     {
 *       storeProductId,
 *       quantity
 *     }
 *   ]
 * }
 *
 * ============================================================================
 *
 * AUCUN PRIX N'EST AJOUTÉ PAR CE COMPOSANT.
 *
 * AUCUN STOCK N'EST AJOUTÉ PAR CE COMPOSANT.
 *
 * AUCUNE DEVISE N'EST AJOUTÉE PAR CE COMPOSANT.
 *
 * ============================================================================
 *
 * La page /panier appellera ensuite :
 *
 * validatePublicPanier()
 *
 * pour obtenir :
 *
 * - prix réel actuel ;
 * - devise réelle actuelle ;
 * - stock réel actuel ;
 * - Product actuel ;
 * - Store actuel ;
 * - StoreProduct actuel ;
 * - sous-total serveur.
 *
 * ============================================================================
 */