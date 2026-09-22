"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  MapPin,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  usePublicPanier,
} from "@/components/public/panier/PublicPanierProvider";

import {
  validatePublicPanier,
} from "@/lib/public/panier/public-panier-actions";

import type {
  PublicPanierItemIssue,
  PublicPanierValidatedItem,
  PublicPanierValidationResult,
} from "@/lib/public/panier/public-panier-types";

import styles from "./public-panier.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE CLIENT — PANIER PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/panier/PublicPanierPage.tsx
 *
 * Route :
 *
 * /panier
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher le Panier public après validation des offres par le serveur.
 *
 * ============================================================================
 *
 * SOURCE NAVIGATEUR :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * SOURCE COMMERCIALE DE VÉRITÉ :
 *
 * validatePublicPanier()
 *
 *        ↓
 *
 * PostgreSQL
 *
 * StoreProduct
 * Product
 * Store
 * ProductImage
 *
 * ============================================================================
 *
 * LA PAGE AFFICHE ENSUITE :
 *
 * - prix serveur ;
 * - devise serveur ;
 * - stock serveur ;
 * - disponibilité serveur ;
 * - boutique serveur ;
 * - sous-totaux serveur ;
 * - quantité validée ;
 * - état réel du Panier.
 *
 * ============================================================================
 *
 * CONTINUER LA COMMANDE :
 *
 * Le composant accepte :
 *
 * continueOrderHref
 *
 * Cette valeur doit provenir de la route officielle de finalisation
 * de commande lorsqu'elle sera définie dans l'architecture centrale.
 *
 * Tant qu'aucune route officielle n'est fournie :
 *
 * - le bouton reste visible ;
 * - aucune fausse URL n'est inventée ;
 * - le bouton reste désactivé.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * La version mobile prévoit :
 *
 * - une barre fixe de poursuite de commande ;
 * - positionnée au-dessus de la navigation mobile existante ;
 * - le Footer sera masqué uniquement sur /panier par le CSS associé ;
 * - les cinq navigations mobiles existantes restent inchangées :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * CETTE PAGE NE :
 *
 * - crée aucune commande ;
 * - crée aucun paiement ;
 * - réserve aucun stock ;
 * - décrémente aucun stock ;
 * - invente aucune route de commande ;
 * - importe pas Prisma ;
 * - interroge pas directement PostgreSQL.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES
   ========================================================================== */

type PublicPanierValidationRecord =
  Readonly<{
    signature:
      string;

    result:
      PublicPanierValidationResult;
  }>;


interface PublicPanierPageProps {
  /**
   * Route officielle permettant de poursuivre vers la création
   * de la commande.
   *
   * Aucune valeur par défaut fictive n'est fournie.
   */
  readonly continueOrderHref?:
    string |
    null;
}


interface PublicPanierErrorProps {
  readonly message:
    string;

  readonly onRetry:
    () => void;
}


interface PublicPanierItemRowProps {
  readonly item:
    PublicPanierValidatedItem;

  readonly onDecrease:
    (
      item:
        PublicPanierValidatedItem,
    ) => void;

  readonly onIncrease:
    (
      item:
        PublicPanierValidatedItem,
    ) => void;

  readonly onAdjustToAvailableStock:
    (
      item:
        PublicPanierValidatedItem,
    ) => void;

  readonly onRemove:
    (
      storeProductId:
        string,
    ) => void;
}


interface PublicPanierDetachedIssueProps {
  readonly issue:
    PublicPanierItemIssue;

  readonly onRemove:
    (
      storeProductId:
        string,
    ) => void;
}


interface PublicPanierContinueOrderActionProps {
  readonly href:
    string |
    null;

  readonly disabled:
    boolean;

  readonly className:
    string;

  readonly ariaLabel?:
    string;
}


/* ==========================================================================
   2. FORMATAGE MONÉTAIRE
   ========================================================================== */

function formatMoney(
  amount:
    string,

  currency:
    string,
): string {
  const normalizedAmount =
    amount.trim();

  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


  const numericAmount =
    Number(
      normalizedAmount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${normalizedAmount} ${normalizedCurrency}`.trim();
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${numericAmount.toLocaleString(
      "fr-FR",
    )} ${normalizedCurrency}`.trim();
  }
}


/* ==========================================================================
   3. ROUTE INTERNE
   ========================================================================== */

/**
 * Cette fonction ne construit aucune route.
 *
 * Elle vérifie uniquement qu'une éventuelle route fournie au composant
 * possède une forme interne exploitable.
 */
function normalizeInternalHref(
  value:
    string |
    null |
    undefined,
): string |
  null {
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
    !normalized.startsWith(
      "/",
    ) ||
    normalized.startsWith(
      "//",
    ) ||
    normalized.includes(
      "\\",
    ) ||
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   4. SIGNATURE DU PANIER
   ========================================================================== */

function buildValidationSignature(
  items:
    readonly {
      readonly storeProductId:
        string;

      readonly quantity:
        number;
    }[],
): string {
  return JSON.stringify(
    items.map(
      (
        item,
      ) => [
        item.storeProductId,
        item.quantity,
      ],
    ),
  );
}


/* ==========================================================================
   5. MESSAGE ERREUR SERVEUR
   ========================================================================== */

function getValidationFailureMessage(
  result:
    Extract<
      PublicPanierValidationResult,
      {
        success:
          false;
      }
    >,
): string {
  switch (
    result.code
  ) {
    case "INVALID_INPUT":
      return "Le contenu du panier n’est pas valide.";

    case "VALIDATION_FAILED":
      return "Le panier n’a pas pu être validé actuellement.";

    case "SERVER_ERROR":
    default:
      return "Impossible de vérifier le panier actuellement. Réessayez dans quelques instants.";
  }
}


/* ==========================================================================
   6. MESSAGE ÉTAT ARTICLE
   ========================================================================== */

function getItemStateLabel(
  item:
    PublicPanierValidatedItem,
): string {
  switch (
    item.panierState
  ) {
    case "AVAILABLE":
      if (
        item.availability ===
        "LOW_STOCK"
      ) {
        return "Stock limité";
      }

      return "Disponible";

    case "OUT_OF_STOCK":
      return "Rupture de stock";

    case "INSUFFICIENT_STOCK":
      return "Quantité supérieure au stock disponible";

    case "UNAVAILABLE":
    default:
      return "Offre indisponible";
  }
}


/* ==========================================================================
   7. MESSAGE OFFRE REJETÉE
   ========================================================================== */

function getIssueMessage(
  issue:
    PublicPanierItemIssue,
): string {
  switch (
    issue.code
  ) {
    case "OFFER_NOT_FOUND":
      return "Cet article n’existe plus dans le catalogue.";

    case "OFFER_UNAVAILABLE":
      return "Cet article n’est plus disponible à la vente.";

    case "OUT_OF_STOCK":
      return "Cet article est actuellement en rupture de stock.";

    case "INSUFFICIENT_STOCK":
      return "La quantité demandée dépasse le stock actuellement disponible.";

    case "INVALID_QUANTITY":
      return "La quantité enregistrée pour cet article n’est pas valide.";

    default:
      return "Cet article ne peut pas être utilisé actuellement.";
  }
}


/* ==========================================================================
   8. ACTION CONTINUER LA COMMANDE
   ========================================================================== */

/**
 * Un seul composant est utilisé pour :
 *
 * - le bouton desktop ;
 * - le bouton mobile fixe.
 *
 * Lorsque la route officielle est absente :
 *
 * - aucun href artificiel ;
 * - aucun /checkout inventé ;
 * - aucun /commande inventé ;
 * - bouton désactivé proprement.
 */
function PublicPanierContinueOrderAction({
  href,
  disabled,
  className,
  ariaLabel,
}: PublicPanierContinueOrderActionProps) {
  if (
    !disabled &&
    href
  ) {
    return (
      <Link
        href={
          href
        }
        className={
          className
        }
        aria-label={
          ariaLabel ??
          "Continuer la commande"
        }
        data-public-panier-continue-order="true"
        data-order-action-enabled="true"
      >
        <span>
          Continuer la commande
        </span>

        <ArrowRight
          size={
            18
          }
          strokeWidth={
            2
          }
          aria-hidden="true"
        />
      </Link>
    );
  }


  return (
    <button
      type="button"
      className={
        className
      }
      disabled
      aria-label={
        ariaLabel ??
        "Continuer la commande"
      }
      title="Finalisation de la commande indisponible actuellement"
      data-public-panier-continue-order="true"
      data-order-action-enabled="false"
    >
      <span>
        Continuer la commande
      </span>

      <ArrowRight
        size={
          18
        }
        strokeWidth={
          2
        }
        aria-hidden="true"
      />
    </button>
  );
}


/* ==========================================================================
   9. CHARGEMENT
   ========================================================================== */

function PublicPanierLoading() {
  return (
    <section
      className={
        styles.panierLoading
      }
      aria-label="Chargement du panier"
      aria-busy="true"
    >
      <div
        className={
          styles.panierLoadingIcon
        }
        aria-hidden="true"
      >
        <LoaderCircle
          size={
            30
          }
          strokeWidth={
            1.8
          }
        />
      </div>


      <div
        className={
          styles.panierLoadingContent
        }
      >
        <h2>
          Vérification du panier
        </h2>

        <p>
          Nous vérifions les prix, les stocks et la disponibilité actuelle de vos articles.
        </p>
      </div>
    </section>
  );
}


/* ==========================================================================
   10. PANIER VIDE
   ========================================================================== */

function PublicPanierEmpty() {
  return (
    <section
      className={
        styles.panierEmpty
      }
      aria-labelledby="public-panier-empty-title"
    >
      <div
        className={
          styles.panierEmptyIcon
        }
        aria-hidden="true"
      >
        <ShoppingBag
          size={
            36
          }
          strokeWidth={
            1.5
          }
        />
      </div>


      <h2
        id="public-panier-empty-title"
        className={
          styles.panierEmptyTitle
        }
      >
        Votre panier est vide
      </h2>


      <p
        className={
          styles.panierEmptyDescription
        }
      >
        Découvrez les produits disponibles et ajoutez les offres qui vous intéressent.
      </p>


      <Link
        href={
          generalAppRoutes.products
        }
        className={
          styles.panierEmptyAction
        }
      >
        <ArrowLeft
          size={
            17
          }
          strokeWidth={
            1.9
          }
          aria-hidden="true"
        />

        Découvrir les produits
      </Link>
    </section>
  );
}


/* ==========================================================================
   11. ERREUR DE VALIDATION
   ========================================================================== */

function PublicPanierError({
  message,
  onRetry,
}: PublicPanierErrorProps) {
  return (
    <section
      className={
        styles.panierError
      }
      role="alert"
    >
      <div
        className={
          styles.panierErrorIcon
        }
        aria-hidden="true"
      >
        <AlertTriangle
          size={
            30
          }
          strokeWidth={
            1.7
          }
        />
      </div>


      <div
        className={
          styles.panierErrorContent
        }
      >
        <h2>
          Impossible de vérifier votre panier
        </h2>

        <p>
          {
            message
          }
        </p>
      </div>


      <button
        type="button"
        className={
          styles.panierRetryButton
        }
        onClick={
          onRetry
        }
      >
        <RefreshCcw
          size={
            16
          }
          strokeWidth={
            1.9
          }
          aria-hidden="true"
        />

        Réessayer
      </button>
    </section>
  );
}


/* ==========================================================================
   12. LIGNE PRODUIT
   ========================================================================== */

function PublicPanierItemRow({
  item,
  onDecrease,
  onIncrease,
  onAdjustToAvailableStock,
  onRemove,
}: PublicPanierItemRowProps) {
  const available =
    item.panierState ===
    "AVAILABLE";


  const canDecrease =
    item.quantity >
    0;


  const canIncrease =
    item.panierState !==
      "OUT_OF_STOCK" &&
    item.availableQuantity >
      item.quantity;


  const canAdjustToStock =
    item.panierState ===
      "INSUFFICIENT_STOCK" &&
    item.availableQuantity >
      0;


  const stateLabel =
    getItemStateLabel(
      item,
    );


  return (
    <article
      className={
        styles.panierItem
      }
      data-panier-item-state={
        item.panierState
      }
      data-store-product-id={
        item.storeProductId
      }
    >
      {/* ==================================================================
          IMAGE
          ================================================================== */}

      <Link
        href={
          item.href
        }
        className={
          styles.panierItemImageLink
        }
        aria-label={`Voir ${item.name}`}
      >
        <span
          className={
            styles.panierItemImageWrapper
          }
        >
          <Image
            src={
              item.image.url
            }
            alt={
              item.image.altText
            }
            fill
            sizes="
              (max-width: 767px) 92px,
              130px
            "
            className={
              styles.panierItemImage
            }
          />
        </span>
      </Link>


      {/* ==================================================================
          INFORMATIONS
          ================================================================== */}

      <div
        className={
          styles.panierItemContent
        }
      >
        <div
          className={
            styles.panierItemTop
          }
        >
          <div
            className={
              styles.panierItemIdentity
            }
          >
            <Link
              href={
                item.href
              }
              className={
                styles.panierItemName
              }
            >
              {
                item.name
              }
            </Link>


            <p
              className={
                styles.panierItemSku
              }
            >
              SKU :{" "}
              <strong>
                {
                  item.sku
                }
              </strong>
            </p>


            <div
              className={
                styles.panierItemStore
              }
            >
              <Store
                size={
                  14
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <span>
                {
                  item.store.name
                }
              </span>

              <span
                className={
                  styles.panierItemStoreSeparator
                }
                aria-hidden="true"
              >
                •
              </span>

              <MapPin
                size={
                  13
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <span>
                {
                  item.store.city
                }
                ,{" "}
                {
                  item.store.country
                }
              </span>
            </div>
          </div>


          <button
            type="button"
            className={
              styles.panierItemRemove
            }
            onClick={
              () =>
                onRemove(
                  item.storeProductId,
                )
            }
            aria-label={`Retirer ${item.name} du panier`}
          >
            <Trash2
              size={
                17
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />
          </button>
        </div>


        {/* ================================================================
            PRIX
            ================================================================ */}

        <div
          className={
            styles.panierItemPricing
          }
        >
          <strong
            className={
              styles.panierItemUnitPrice
            }
          >
            {
              formatMoney(
                item.unitPrice,
                item.currency,
              )
            }
          </strong>


          {item.compareAtPrice ? (
            <span
              className={
                styles.panierItemComparePrice
              }
            >
              {
                formatMoney(
                  item.compareAtPrice,
                  item.currency,
                )
              }
            </span>
          ) : null}
        </div>


        {/* ================================================================
            DISPONIBILITÉ
            ================================================================ */}

        <div
          className={
            styles.panierItemAvailability
          }
          data-available={
            available
              ? "true"
              : "false"
          }
        >
          {available ? (
            <PackageCheck
              size={
                16
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />
          ) : item.panierState ===
            "OUT_OF_STOCK" ? (
            <PackageX
              size={
                16
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              size={
                16
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />
          )}

          <span>
            {
              stateLabel
            }
          </span>


          {item.panierState ===
          "AVAILABLE" ? (
            <span
              className={
                styles.panierItemStock
              }
            >
              ·{" "}
              {
                item.availableQuantity
              }{" "}
              unité
              {
                item.availableQuantity >
                1
                  ? "s"
                  : ""
              }{" "}
              disponible
              {
                item.availableQuantity >
                1
                  ? "s"
                  : ""
              }
            </span>
          ) : null}
        </div>


        {/* ================================================================
            QUANTITÉ + SOUS-TOTAL
            ================================================================ */}

        <div
          className={
            styles.panierItemBottom
          }
        >
          <div
            className={
              styles.panierQuantity
            }
            aria-label={`Quantité de ${item.name}`}
          >
            <button
              type="button"
              className={
                styles.panierQuantityButton
              }
              disabled={
                !canDecrease
              }
              onClick={
                () =>
                  onDecrease(
                    item,
                  )
              }
              aria-label={`Diminuer la quantité de ${item.name}`}
            >
              <Minus
                size={
                  15
                }
                strokeWidth={
                  2
                }
                aria-hidden="true"
              />
            </button>


            <output
              className={
                styles.panierQuantityValue
              }
              aria-live="polite"
            >
              {
                item.quantity
              }
            </output>


            <button
              type="button"
              className={
                styles.panierQuantityButton
              }
              disabled={
                !canIncrease
              }
              onClick={
                () =>
                  onIncrease(
                    item,
                  )
              }
              aria-label={`Augmenter la quantité de ${item.name}`}
            >
              <Plus
                size={
                  15
                }
                strokeWidth={
                  2
                }
                aria-hidden="true"
              />
            </button>
          </div>


          <div
            className={
              styles.panierItemSubtotal
            }
          >
            <span>
              Sous-total
            </span>

            <strong>
              {
                formatMoney(
                  item.lineSubtotal,
                  item.currency,
                )
              }
            </strong>
          </div>
        </div>


        {/* ================================================================
            STOCK INSUFFISANT
            ================================================================ */}

        {item.panierState ===
        "INSUFFICIENT_STOCK" ? (
          <div
            className={
              styles.panierItemWarning
            }
            role="status"
          >
            <CircleAlert
              size={
                17
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Stock insuffisant
              </strong>

              <p>
                Vous avez demandé{" "}
                {
                  item.quantity
                }{" "}
                unité
                {
                  item.quantity >
                  1
                    ? "s"
                    : ""
                }
                , mais seulement{" "}
                {
                  item.availableQuantity
                }{" "}
                sont actuellement disponibles.
              </p>
            </div>


            {canAdjustToStock ? (
              <button
                type="button"
                className={
                  styles.panierAdjustStockButton
                }
                onClick={
                  () =>
                    onAdjustToAvailableStock(
                      item,
                    )
                }
              >
                Ajuster à{" "}
                {
                  item.availableQuantity
                }
              </button>
            ) : null}
          </div>
        ) : null}


        {/* ================================================================
            RUPTURE
            ================================================================ */}

        {item.panierState ===
        "OUT_OF_STOCK" ? (
          <div
            className={
              styles.panierItemWarning
            }
            role="status"
          >
            <PackageX
              size={
                17
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Produit en rupture
              </strong>

              <p>
                Cette offre reste visible dans votre panier, mais elle ne peut pas être incluse dans le total commandable.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}


/* ==========================================================================
   13. OFFRE NON RETOURNÉE
   ========================================================================== */

function PublicPanierDetachedIssue({
  issue,
  onRemove,
}: PublicPanierDetachedIssueProps) {
  return (
    <article
      className={
        styles.panierDetachedIssue
      }
      role="status"
    >
      <div
        className={
          styles.panierDetachedIssueIcon
        }
        aria-hidden="true"
      >
        <PackageX
          size={
            22
          }
          strokeWidth={
            1.7
          }
        />
      </div>


      <div
        className={
          styles.panierDetachedIssueContent
        }
      >
        <strong>
          Article indisponible
        </strong>

        <p>
          {
            getIssueMessage(
              issue,
            )
          }
        </p>
      </div>


      <button
        type="button"
        className={
          styles.panierDetachedIssueRemove
        }
        onClick={
          () =>
            onRemove(
              issue.storeProductId,
            )
        }
      >
        <Trash2
          size={
            15
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        Retirer
      </button>
    </article>
  );
}


/* ==========================================================================
   14. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicPanierPage({
  continueOrderHref = null,
}: PublicPanierPageProps) {
  const {
    state,
    actions,
  } =
    usePublicPanier();


  /* =========================================================================
     ROUTE DE POURSUITE
     ========================================================================= */

  const normalizedContinueOrderHref =
    useMemo(
      () =>
        normalizeInternalHref(
          continueOrderHref,
        ),

      [
        continueOrderHref,
      ],
    );


  /* =========================================================================
     VALIDATION SERVEUR
     ========================================================================= */

  const [
    validationRecord,
    setValidationRecord,
  ] =
    useState<
      PublicPanierValidationRecord |
      null
    >(
      null,
    );


  const [
    refreshNonce,
    setRefreshNonce,
  ] =
    useState(
      0,
    );


  /* =========================================================================
     SIGNATURE COURANTE
     ========================================================================= */

  const validationSignature =
    useMemo(
      () =>
        buildValidationSignature(
          state.items,
        ),

      [
        state.items,
      ],
    );


  /* =========================================================================
     VALIDATION AUTOMATIQUE
     ========================================================================= */

  useEffect(
    () => {
      if (
        !state.hydrated ||
        state.items.length ===
          0
      ) {
        return;
      }


      let cancelled =
        false;


      const currentSignature =
        validationSignature;


      void validatePublicPanier({
        items:
          state.items,
      })
        .then(
          (
            result,
          ) => {
            if (
              cancelled
            ) {
              return;
            }


            setValidationRecord({
              signature:
                currentSignature,

              result,
            });
          },
        )
        .catch(
          () => {
            if (
              cancelled
            ) {
              return;
            }


            setValidationRecord({
              signature:
                currentSignature,

              result: {
                success:
                  false,

                code:
                  "SERVER_ERROR",
              },
            });
          },
        );


      return () => {
        cancelled =
          true;
      };
    },

    [
      refreshNonce,
      state.hydrated,
      state.items,
      validationSignature,
    ],
  );


  /* =========================================================================
     RÉSULTAT ACTUEL
     ========================================================================= */

  const validationResult =
    validationRecord?.signature ===
    validationSignature
      ? validationRecord.result
      : null;


  /* =========================================================================
     ACTIONS
     ========================================================================= */

  function handleRetry():
    void {
    setValidationRecord(
      null,
    );


    setRefreshNonce(
      (
        current,
      ) =>
        current +
        1,
    );
  }


  function handleRemove(
    storeProductId:
      string,
  ): void {
    actions.removeItem({
      storeProductId,
    });
  }


  function handleDecrease(
    item:
      PublicPanierValidatedItem,
  ): void {
    if (
      item.quantity <=
      1
    ) {
      actions.removeItem({
        storeProductId:
          item.storeProductId,
      });


      return;
    }


    actions.setQuantity({
      storeProductId:
        item.storeProductId,

      quantity:
        item.quantity -
        1,
    });
  }


  function handleIncrease(
    item:
      PublicPanierValidatedItem,
  ): void {
    if (
      item.availableQuantity <=
      item.quantity
    ) {
      return;
    }


    actions.setQuantity({
      storeProductId:
        item.storeProductId,

      quantity:
        item.quantity +
        1,
    });
  }


  function handleAdjustToAvailableStock(
    item:
      PublicPanierValidatedItem,
  ): void {
    if (
      item.availableQuantity <=
      0
    ) {
      return;
    }


    actions.setQuantity({
      storeProductId:
        item.storeProductId,

      quantity:
        item.availableQuantity,
    });
  }


  function handleClear():
    void {
    actions.clear();
  }


  /* =========================================================================
     HYDRATATION
     ========================================================================= */

  if (
    !state.hydrated
  ) {
    return (
      <div
        className={
          styles.panierPage
        }
        data-public-panier-page="true"
        data-panier-state="hydrating"
      >
        <PublicPanierLoading />
      </div>
    );
  }


  /* =========================================================================
     PANIER VIDE
     ========================================================================= */

  if (
    state.items.length ===
    0
  ) {
    return (
      <div
        className={
          styles.panierPage
        }
        data-public-panier-page="true"
        data-panier-state="empty"
      >
        <div
          className={
            styles.panierPageInner
          }
        >
          <header
            className={
              styles.panierHeader
            }
          >
            <div
              className={
                styles.panierHeaderContent
              }
            >
              <p
                className={
                  styles.panierHeaderEyebrow
                }
              >
                Panier
              </p>

              <h1
                className={
                  styles.panierHeaderTitle
                }
              >
                Mon panier
              </h1>
            </div>
          </header>


          <PublicPanierEmpty />
        </div>
      </div>
    );
  }


  /* =========================================================================
     VALIDATION EN COURS
     ========================================================================= */

  if (
    !validationResult
  ) {
    return (
      <div
        className={
          styles.panierPage
        }
        data-public-panier-page="true"
        data-panier-state="validating"
      >
        <div
          className={
            styles.panierPageInner
          }
        >
          <PublicPanierLoading />
        </div>
      </div>
    );
  }


  /* =========================================================================
     ERREUR
     ========================================================================= */

  if (
    !validationResult.success
  ) {
    return (
      <div
        className={
          styles.panierPage
        }
        data-public-panier-page="true"
        data-panier-state="error"
      >
        <div
          className={
            styles.panierPageInner
          }
        >
          <PublicPanierError
            message={
              getValidationFailureMessage(
                validationResult,
              )
            }
            onRetry={
              handleRetry
            }
          />
        </div>
      </div>
    );
  }


  /* =========================================================================
     SNAPSHOT VALIDÉ
     ========================================================================= */

  const snapshot =
    validationResult.data;


  /* =========================================================================
     ISSUES SANS LIGNE PRODUIT
     ========================================================================= */

  const returnedItemIds =
    new Set(
      snapshot.items.map(
        (
          item,
        ) =>
          item.storeProductId,
      ),
    );


  const detachedIssues =
    snapshot.issues.filter(
      (
        issue,
      ) =>
        !returnedItemIds.has(
          issue.storeProductId,
        ),
    );


  /* =========================================================================
     ÉTAT DE POURSUITE COMMANDE
     ========================================================================= */

  /**
   * Le Panier est commercialement prêt seulement lorsque :
   *
   * - aucune anomalie n'est présente ;
   * - au moins une offre validée existe ;
   * - au moins une unité validée existe.
   *
   * On ne bloque pas artificiellement un Panier multi-devise ici :
   * aucune règle métier de commande multi-devise n'est inventée.
   */
  const isOrderReady =
    !snapshot.hasIssues &&
    snapshot.summary
      .itemCount >
      0 &&
    snapshot.summary
      .totalQuantity >
      0;


  /**
   * La poursuite réelle exige EN PLUS une vraie route officielle.
   */
  const canContinueOrder =
    isOrderReady &&
    normalizedContinueOrderHref !==
      null;


  /* =========================================================================
     TOTAL MOBILE
     ========================================================================= */

  let mobileOrderAmountLabel =
    "Total à vérifier";


  if (
    snapshot.summary
      .hasSingleCurrency &&
    snapshot.summary
      .singleCurrency &&
    snapshot.summary
      .singleCurrencySubtotal
  ) {
    mobileOrderAmountLabel =
      formatMoney(
        snapshot.summary
          .singleCurrencySubtotal,
        snapshot.summary
          .singleCurrency,
      );
  } else if (
    snapshot.summary
      .hasMixedCurrencies
  ) {
    mobileOrderAmountLabel =
      "Plusieurs devises";
  } else if (
    snapshot.summary
      .itemCount ===
      0
  ) {
    mobileOrderAmountLabel =
      "Aucun total";
  }


  /* =========================================================================
     RENDU FINAL
     ========================================================================= */

  return (
    <div
      className={
        styles.panierPage
      }
      data-public-panier-page="true"
      data-panier-state="ready"
      data-panier-has-issues={
        snapshot.hasIssues
          ? "true"
          : "false"
      }
      data-panier-order-ready={
        isOrderReady
          ? "true"
          : "false"
      }
    >
      <div
        className={
          styles.panierPageInner
        }
      >
        {/* ==================================================================
            HEADER
            ================================================================== */}

        <header
          className={
            styles.panierHeader
          }
        >
          <div
            className={
              styles.panierHeaderContent
            }
          >
            <p
              className={
                styles.panierHeaderEyebrow
              }
            >
              Panier
            </p>


            <h1
              className={
                styles.panierHeaderTitle
              }
            >
              Mon panier
            </h1>


            <p
              className={
                styles.panierHeaderDescription
              }
            >
              Vérifiez vos articles avant de poursuivre votre commande.
            </p>
          </div>


          <div
            className={
              styles.panierHeaderActions
            }
          >
            <Link
              href={
                generalAppRoutes.products
              }
              className={
                styles.panierContinueShopping
              }
            >
              <ArrowLeft
                size={
                  16
                }
                strokeWidth={
                  1.9
                }
                aria-hidden="true"
              />

              Continuer mes achats
            </Link>


            <button
              type="button"
              className={
                styles.panierClearButton
              }
              onClick={
                handleClear
              }
            >
              <Trash2
                size={
                  15
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              Vider le panier
            </button>
          </div>
        </header>


        {/* ==================================================================
            AVERTISSEMENT GLOBAL
            ================================================================== */}

        {snapshot.hasIssues ? (
          <div
            className={
              styles.panierGlobalWarning
            }
            role="status"
          >
            <AlertTriangle
              size={
                19
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Votre panier nécessite une vérification
              </strong>

              <p>
                Certains articles ont changé de disponibilité ou de stock depuis leur ajout.
              </p>
            </div>
          </div>
        ) : null}


        {/* ==================================================================
            LAYOUT
            ================================================================== */}

        <div
          className={
            styles.panierLayout
          }
        >
          {/* ================================================================
              ARTICLES
              ================================================================ */}

          <section
            className={
              styles.panierItemsSection
            }
            aria-labelledby="public-panier-items-title"
          >
            <div
              className={
                styles.panierItemsHeader
              }
            >
              <h2
                id="public-panier-items-title"
                className={
                  styles.panierItemsTitle
                }
              >
                Articles
              </h2>


              <span
                className={
                  styles.panierItemsCount
                }
              >
                {
                  state.itemCount
                }{" "}
                article
                {
                  state.itemCount >
                  1
                    ? "s"
                    : ""
                }
              </span>
            </div>


            <div
              className={
                styles.panierItemsList
              }
            >
              {snapshot.items.map(
                (
                  item,
                ) => (
                  <PublicPanierItemRow
                    key={
                      item.storeProductId
                    }
                    item={
                      item
                    }
                    onDecrease={
                      handleDecrease
                    }
                    onIncrease={
                      handleIncrease
                    }
                    onAdjustToAvailableStock={
                      handleAdjustToAvailableStock
                    }
                    onRemove={
                      handleRemove
                    }
                  />
                ),
              )}


              {detachedIssues.map(
                (
                  issue,
                ) => (
                  <PublicPanierDetachedIssue
                    key={
                      `${issue.storeProductId}-${issue.code}`
                    }
                    issue={
                      issue
                    }
                    onRemove={
                      handleRemove
                    }
                  />
                ),
              )}
            </div>
          </section>


          {/* ================================================================
              RÉSUMÉ
              ================================================================ */}

          <aside
            className={
              styles.panierSummary
            }
            aria-labelledby="public-panier-summary-title"
          >
            <div
              className={
                styles.panierSummaryCard
              }
            >
              <h2
                id="public-panier-summary-title"
                className={
                  styles.panierSummaryTitle
                }
              >
                Résumé du panier
              </h2>


              {/* ============================================================
                  QUANTITÉS
                  ============================================================ */}

              <dl
                className={
                  styles.panierSummaryDetails
                }
              >
                <div
                  className={
                    styles.panierSummaryRow
                  }
                >
                  <dt>
                    Articles validés
                  </dt>

                  <dd>
                    {
                      snapshot.summary
                        .itemCount
                    }
                  </dd>
                </div>


                <div
                  className={
                    styles.panierSummaryRow
                  }
                >
                  <dt>
                    Quantité totale validée
                  </dt>

                  <dd>
                    {
                      snapshot.summary
                        .totalQuantity
                    }
                  </dd>
                </div>
              </dl>


              {/* ============================================================
                  SOUS-TOTAUX
                  ============================================================ */}

              {snapshot.summary
                .subtotals.length >
              0 ? (
                <div
                  className={
                    styles.panierSummaryTotals
                  }
                >
                  {snapshot.summary
                    .subtotals
                    .map(
                      (
                        subtotal,
                      ) => (
                        <div
                          key={
                            subtotal.currency
                          }
                          className={
                            styles.panierSummaryTotalRow
                          }
                        >
                          <span>
                            Sous-total{" "}
                            {
                              subtotal.currency
                            }
                          </span>

                          <strong>
                            {
                              formatMoney(
                                subtotal.subtotal,
                                subtotal.currency,
                              )
                            }
                          </strong>
                        </div>
                      ),
                    )}
                </div>
              ) : (
                <div
                  className={
                    styles.panierSummaryNoTotal
                  }
                >
                  Aucun article n’est actuellement commandable.
                </div>
              )}


              {/* ============================================================
                  MULTI-DEVISE
                  ============================================================ */}

              {snapshot.summary
                .hasMixedCurrencies ? (
                <div
                  className={
                    styles.panierCurrencyWarning
                  }
                  role="status"
                >
                  <CircleAlert
                    size={
                      17
                    }
                    strokeWidth={
                      1.8
                    }
                    aria-hidden="true"
                  />

                  <p>
                    Votre panier contient plusieurs devises. Les montants restent séparés et ne sont pas additionnés automatiquement.
                  </p>
                </div>
              ) : null}


              {/* ============================================================
                  PANIER VÉRIFIÉ
                  ============================================================ */}

              {!snapshot.hasIssues &&
              snapshot.summary
                .itemCount >
                0 ? (
                <div
                  className={
                    styles.panierSummaryReady
                  }
                  role="status"
                >
                  <PackageCheck
                    size={
                      18
                    }
                    strokeWidth={
                      1.9
                    }
                    aria-hidden="true"
                  />

                  <div>
                    <strong>
                      Panier vérifié
                    </strong>

                    <span>
                      Les informations affichées ont été vérifiées côté serveur.
                    </span>
                  </div>
                </div>
              ) : null}


              {/* ============================================================
                  CONTINUER LA COMMANDE — DESKTOP
                  ============================================================ */}

              <div
                className={
                  styles.panierSummaryOrderAction
                }
              >
                <PublicPanierContinueOrderAction
                  href={
                    normalizedContinueOrderHref
                  }
                  disabled={
                    !canContinueOrder
                  }
                  className={
                    styles.panierContinueOrderButton
                  }
                />
              </div>


              {/* ============================================================
                  NOTICE
                  ============================================================ */}

              <p
                className={
                  styles.panierSummaryNotice
                }
              >
                Les prix et stocks seront vérifiés à nouveau avant la création définitive de la commande.
              </p>
            </div>
          </aside>
        </div>
      </div>


      {/* ==================================================================
          ACTION MOBILE FIXE
          ==================================================================
          
          Cette barre sera :
          
          - affichée uniquement en mobile par le CSS ;
          - fixée juste au-dessus des 5 navigations mobiles ;
          - toujours visible pendant le défilement ;
          - absente lorsqu'il n'y a pas de Panier validé.
          
          Aucun Footer mobile ne doit apparaître sur /panier.
          ================================================================== */}

      <div
        className={
          styles.panierMobileOrderBar
        }
        data-public-panier-mobile-order-bar="true"
        data-order-ready={
          isOrderReady
            ? "true"
            : "false"
        }
      >
        <div
          className={
            styles.panierMobileOrderBarInner
          }
        >
          <div
            className={
              styles.panierMobileOrderTotal
            }
          >
            <span
              className={
                styles.panierMobileOrderTotalLabel
              }
            >
              Total
            </span>

            <strong
              className={
                styles.panierMobileOrderTotalValue
              }
            >
              {
                mobileOrderAmountLabel
              }
            </strong>
          </div>


          <PublicPanierContinueOrderAction
            href={
              normalizedContinueOrderHref
            }
            disabled={
              !canContinueOrder
            }
            className={
              styles.panierMobileContinueOrderButton
            }
            ariaLabel="Continuer la commande"
          />
        </div>
      </div>
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES :
 *
 * 1.
 *
 * localStorage conserve uniquement :
 *
 * storeProductId
 * quantity
 *
 * ============================================================================
 *
 * 2.
 *
 * validatePublicPanier() recharge les informations commerciales.
 *
 * ============================================================================
 *
 * 3.
 *
 * LE NAVIGATEUR N'EST PAS AUTORITÉ POUR :
 *
 * prix
 * devise
 * stock
 * disponibilité
 * boutique
 * sous-total
 *
 * ============================================================================
 *
 * 4.
 *
 * OUT_OF_STOCK :
 *
 * l'offre peut rester visible mais ne devient pas commandable.
 *
 * ============================================================================
 *
 * 5.
 *
 * INSUFFICIENT_STOCK :
 *
 * la cliente peut :
 *
 * - diminuer la quantité ;
 * - ajuster au stock disponible ;
 * - retirer le produit.
 *
 * ============================================================================
 *
 * 6.
 *
 * MULTI-DEVISE :
 *
 * les montants ne sont pas additionnés artificiellement.
 *
 * ============================================================================
 *
 * 7.
 *
 * CONTINUER LA COMMANDE :
 *
 * aucun /checkout fictif ;
 * aucun /commande fictif ;
 * aucune redirection inventée.
 *
 * La route officielle sera transmise avec :
 *
 * continueOrderHref
 *
 * ============================================================================
 *
 * 8.
 *
 * MOBILE :
 *
 * PublicPanierPage fournit :
 *
 * data-public-panier-page="true"
 *
 * afin que le CSS puisse :
 *
 * - masquer uniquement le Footer de /panier en mobile ;
 * - conserver les cinq navigations mobiles ;
 * - afficher la barre "Continuer la commande" au-dessus de celles-ci.
 *
 * ============================================================================
 */