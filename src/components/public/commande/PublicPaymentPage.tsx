"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  usePublicPanier,
} from "@/components/public/panier/PublicPanierProvider";

import {
  PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY,
} from "@/components/public/commande/PublicCommandePage";

import {
  preparePublicCommandeCheckout,
} from "@/lib/public/commande/public-commande-actions";

import {
  submitPublicPaymentAction,
} from "@/lib/public/commande/public-payment-actions";

import {
  safeParsePublicCommandePrepareInput,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandeMoney,
  PublicCommandePrepareInput,
  PublicCommandePreparedCheckout,
  PublicCommandeValidatedItem,
} from "@/lib/public/commande/public-commande-types";

import type {
  PublicPaymentBrowserDraft,
  PublicPaymentSelection,
} from "@/lib/public/commande/public-payment-types";

import styles from "./public-payment.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — PAIEMENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicPaymentPage.tsx
 *
 * Route :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Permettre à la cliente de :
 *
 * - revoir sa commande ;
 * - revoir son adresse de livraison ;
 * - revoir le total recalculé côté serveur ;
 * - choisir le mode de paiement disponible ;
 * - confirmer la commande ;
 * - continuer ensuite vers /commande/succes.
 *
 * ============================================================================
 *
 * MODE ACTUELLEMENT DISPONIBLE :
 *
 * - Paiement à la livraison.
 *
 * ============================================================================
 *
 * PAIEMENT EN LIGNE :
 *
 * L'interface prévoit son emplacement mais le désactive tant qu'aucun
 * provider réel n'est configuré côté serveur.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant ne fait JAMAIS confiance aux montants du sessionStorage.
 *
 * sessionStorage contient uniquement :
 *
 * - storeProductId ;
 * - quantity ;
 * - cliente ;
 * - adresse.
 *
 * Dès le chargement de cette page :
 *
 * preparePublicCommandeCheckout()
 *
 * est rappelé afin de revérifier côté serveur :
 *
 * - produits ;
 * - prix ;
 * - stock ;
 * - devise ;
 * - livraison ;
 * - total.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. ÉTATS
   ========================================================================== */

type PublicPaymentPageViewStatus =
  | "LOADING"
  | "READY"
  | "ERROR";


/* ==========================================================================
   2. RÉFÉRENCE SUCCÈS
   ========================================================================== */

/**
 * Base de route centralisée.
 *
 * La query order ne constitue JAMAIS une preuve de paiement.
 *
 * public-success-query.ts devra relire la vraie commande en base.
 */
function buildSuccessRoute(
  orderId:
    string,
): string {
  const params =
    new URLSearchParams({
      orderId,
    });


  return `${generalAppRoutes.checkoutSuccess}?${params.toString()}`;
}


/**
 * La Server Action reste la source de vérité.
 *
 * Cette fonction ne suppose pas inutilement le nom exact du champ
 * retourné par une ancienne version du contrat.
 *
 * Le contrat actuel doit idéalement fournir "id".
 *
 * "orderId" reste accepté comme compatibilité défensive afin qu'une
 * transition de contrat ne fasse pas perdre une commande déjà créée.
 */
function getCreatedOrderId(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }


  const record =
    value as Record<
      string,
      unknown
    >;


  const candidate =
    typeof record.id ===
      "string"
      ? record.id
      : typeof record.orderId ===
          "string"
        ? record.orderId
        : null;


  const normalized =
    candidate?.trim() ??
    "";


  return normalized ||
    null;
}


/* ==========================================================================
   3. FORMATAGE MONÉTAIRE
   ========================================================================== */

function formatMoney(
  money:
    PublicCommandeMoney | null,
): string {
  if (
    money ===
    null
  ) {
    return "À vérifier";
  }


  const currency =
    money.currency
      .trim()
      .toUpperCase();


  const numericAmount =
    Number(
      money.amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${money.amount} ${currency}`.trim();
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency,

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
    )} ${currency}`.trim();
  }
}


/* ==========================================================================
   4. FORMAT QUANTITÉ
   ========================================================================== */

function formatQuantity(
  quantity:
    number,
): string {
  return quantity >
    1
    ? `${quantity} articles`
    : `${quantity} article`;
}


/* ==========================================================================
   5. PARSE BROUILLON SESSION STORAGE
   ========================================================================== */

function parsePaymentDraft(
  rawValue:
    string,
): PublicPaymentBrowserDraft | null {
  try {
    const parsed:
      unknown =
        JSON.parse(
          rawValue,
        );


    if (
      typeof parsed !==
        "object" ||
      parsed ===
        null ||
      Array.isArray(
        parsed,
      )
    ) {
      return null;
    }


    const record =
      parsed as Record<
        string,
        unknown
      >;


    if (
      record.version !==
        1 ||
      typeof record.createdAt !==
        "string"
    ) {
      return null;
    }


    const inputResult =
      safeParsePublicCommandePrepareInput(
        record.input,
      );


    if (
      !inputResult.success
    ) {
      return null;
    }


    return {
      version:
        1,

      createdAt:
        record.createdAt,

      input:
        inputResult.data,
    };
  } catch {
    return null;
  }
}


/* ==========================================================================
   6. IMAGE PRODUIT
   ========================================================================== */

function PaymentProductImage({
  item,
}: Readonly<{
  item:
    PublicCommandeValidatedItem;
}>) {
  if (
    !item.image?.url
  ) {
    return (
      <div
        className={
          styles.paymentProductImageFallback
        }
        aria-hidden="true"
      >
        <ShoppingBag
          size={
            24
          }
          strokeWidth={
            1.6
          }
        />
      </div>
    );
  }


  return (
    <div
      className={
        styles.paymentProductImage
      }
    >
      <Image
        src={
          item.image.url
        }
        alt={
          item.image.altText ??
          item.name
        }
        fill={
          true
        }
        sizes="76px"
        className={
          styles.paymentProductImageElement
        }
      />
    </div>
  );
}


/* ==========================================================================
   7. PRODUIT
   ========================================================================== */

function PaymentProductItem({
  item,
}: Readonly<{
  item:
    PublicCommandeValidatedItem;
}>) {
  return (
    <article
      className={
        styles.paymentProduct
      }
    >
      <PaymentProductImage
        item={
          item
        }
      />


      <div
        className={
          styles.paymentProductContent
        }
      >
        <div
          className={
            styles.paymentProductTop
          }
        >
          <div>
            <h3
              className={
                styles.paymentProductName
              }
            >
              {item.name}
            </h3>


            {item.sku ? (
              <p
                className={
                  styles.paymentProductSku
                }
              >
                Réf. {item.sku}
              </p>
            ) : null}
          </div>


          <strong
            className={
              styles.paymentProductSubtotal
            }
          >
            {formatMoney(
              item.subtotal,
            )}
          </strong>
        </div>


        <div
          className={
            styles.paymentProductStore
          }
        >
          <Store
            size={
              13
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <span>
            {item.store.name}
          </span>
        </div>


        <div
          className={
            styles.paymentProductMeta
          }
        >
          <span>
            Quantité :{" "}
            <strong>
              {item.quantity}
            </strong>
          </span>

          <span
            aria-hidden="true"
          >
            •
          </span>

          <span>
            {formatMoney(
              item.unitPrice,
            )} / unité
          </span>
        </div>
      </div>
    </article>
  );
}


/* ==========================================================================
   8. LIGNE FINANCIÈRE
   ========================================================================== */

function PaymentFinancialRow({
  label,
  value,
  total = false,
}: Readonly<{
  label:
    string;

  value:
    string;

  total?:
    boolean;
}>) {
  return (
    <div
      className={
        total
          ? `${styles.paymentFinancialRow} ${styles.paymentFinancialRowTotal}`
          : styles.paymentFinancialRow
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


/* ==========================================================================
   9. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicPaymentPage() {
  const router =
    useRouter();


  const {
    actions:
      panierActions,
  } =
    usePublicPanier();


  /* =========================================================================
     ÉTAT GLOBAL
     ========================================================================= */

  const [
    viewStatus,
    setViewStatus,
  ] =
    useState<PublicPaymentPageViewStatus>(
      "LOADING",
    );


  const [
    checkoutInput,
    setCheckoutInput,
  ] =
    useState<
      PublicCommandePrepareInput |
      null
    >(
      null,
    );


  const [
    checkout,
    setCheckout,
  ] =
    useState<
      PublicCommandePreparedCheckout |
      null
    >(
      null,
    );


  const [
    selection,
    setSelection,
  ] =
    useState<PublicPaymentSelection>({
      mode:
        "CASH_ON_DELIVERY",
    });


  const [
    message,
    setMessage,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false,
    );


  const [
    retryNonce,
    setRetryNonce,
  ] =
    useState(
      0,
    );


  /* =========================================================================
     CHARGEMENT DU CHECKOUT
     ========================================================================= */

  useEffect(
    () => {
      let cancelled =
        false;


      /**
       * IMPORTANT — React / ESLint :
       *
       * On ne modifie pas synchroniquement l'état React directement
       * dans le corps du useEffect.
       *
       * Le chargement est déclenché dans une tâche différée annulable.
       * Cela évite react-hooks/set-state-in-effect tout en conservant
       * exactement le même flux métier :
       *
       * sessionStorage
       *      ↓
       * validation du brouillon
       *      ↓
       * revalidation complète serveur
       *      ↓
       * READY / ERROR
       */
      const loadTimeout =
        window.setTimeout(
          () => {
            if (
              cancelled
            ) {
              return;
            }


            setViewStatus(
              "LOADING",
            );

            setMessage(
              null,
            );

            setCheckout(
              null,
            );


            const rawDraft =
              window.sessionStorage.getItem(
                PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY,
              );


            if (
              !rawDraft
            ) {
              setCheckoutInput(
                null,
              );

              setMessage(
                "Aucune commande en cours n’a été trouvée. Revenez à l’étape précédente pour vérifier vos informations.",
              );

              setViewStatus(
                "ERROR",
              );

              return;
            }


            const draft =
              parsePaymentDraft(
                rawDraft,
              );


            if (
              draft ===
              null
            ) {
              window.sessionStorage.removeItem(
                PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY,
              );

              setCheckoutInput(
                null,
              );

              setMessage(
                "Les informations temporaires de la commande ne sont plus valides. Veuillez reprendre la vérification.",
              );

              setViewStatus(
                "ERROR",
              );

              return;
            }


            setCheckoutInput(
              draft.input,
            );


            void preparePublicCommandeCheckout(
              draft.input,
            )
              .then(
                (
                  result,
                ) => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  if (
                    !result.success
                  ) {
                    setCheckout(
                      null,
                    );

                    setMessage(
                      result.message,
                    );

                    setViewStatus(
                      "ERROR",
                    );

                    return;
                  }


                  setCheckout(
                    result.data,
                  );

                  setViewStatus(
                    "READY",
                  );
                },
              )
              .catch(
                () => {
                  if (
                    cancelled
                  ) {
                    return;
                  }


                  setCheckout(
                    null,
                  );

                  setMessage(
                    "Impossible de vérifier votre commande actuellement. Réessayez dans quelques instants.",
                  );

                  setViewStatus(
                    "ERROR",
                  );
                },
              );
          },
          0,
        );


      return () => {
        cancelled =
          true;

        window.clearTimeout(
          loadTimeout,
        );
      };
    },

    [
      retryNonce,
    ],
  );


  /* =========================================================================
     TOTAL
     ========================================================================= */

  const total =
    checkout?.summary.total ??
    null;


  /* =========================================================================
     QUANTITÉ
     ========================================================================= */

  const totalQuantity =
    useMemo(
      () =>
        checkout?.snapshot.totalQuantity ??
        0,

      [
        checkout,
      ],
    );


  /* =========================================================================
     CASH ON DELIVERY
     ========================================================================= */

  function handleSelectCashOnDelivery():
    void {
    if (
      isSubmitting
    ) {
      return;
    }


    setSelection({
      mode:
        "CASH_ON_DELIVERY",
    });

    setMessage(
      null,
    );
  }


  /* =========================================================================
     RETRY
     ========================================================================= */

  function handleRetry():
    void {
    if (
      isSubmitting
    ) {
      return;
    }


    /**
     * Cette mise à jour provient d'une action explicite de l'utilisateur,
     * et non du corps d'un useEffect.
     *
     * L'interface passe donc immédiatement en chargement pendant que le
     * nonce provoque une nouvelle revalidation serveur.
     */
    setViewStatus(
      "LOADING",
    );

    setMessage(
      null,
    );

    setCheckout(
      null,
    );


    setRetryNonce(
      (
        current,
      ) =>
        current +
        1,
    );
  }


  /* =========================================================================
     FINALISATION
     ========================================================================= */

  async function handleSubmit():
    Promise<void> {
    if (
      isSubmitting ||
      checkout ===
        null ||
      checkoutInput ===
        null
    ) {
      return;
    }


    setIsSubmitting(
      true,
    );

    setMessage(
      null,
    );


    try {
      /**
       * La Server Action revalide ENCORE le checkout.
       *
       * La donnée actuellement affichée n'est donc pas utilisée
       * aveuglément pour créer la commande.
       */
      const result =
        await submitPublicPaymentAction({
          checkout:
            checkoutInput,

          selection,
        });


      if (
        !result.success
      ) {
        setMessage(
          result.message,
        );

        /**
         * Certaines erreurs impliquent que le checkout affiché peut
         * désormais être obsolète.
         *
         * On refait alors immédiatement une vérification visuelle.
         */
        switch (
          result.code
        ) {
          case "PANIER_CHANGED":
          case "OFFER_NOT_FOUND":
          case "OFFER_UNAVAILABLE":
          case "OUT_OF_STOCK":
          case "INSUFFICIENT_STOCK":
          case "DELIVERY_UNAVAILABLE":
          case "CURRENCY_MISMATCH":
          case "TOTAL_CHANGED":
            setRetryNonce(
              (
                current,
              ) =>
                current +
                1,
            );

            break;


          default:
            break;
        }


        return;
      }


      const firstOrder =
        result.data.orders[
          0
        ];


      if (
        !firstOrder
      ) {
        setMessage(
          "La commande a été traitée mais aucune référence exploitable n’a été retournée.",
        );

        return;
      }


      /**
       * /commande/succes relit maintenant la commande par son identifiant
       * PostgreSQL réel.
       *
       * On ne transmet aucun prix, aucun total et aucun statut dans l'URL.
       */
      const createdOrderId =
        getCreatedOrderId(
          firstOrder,
        );


      if (
        !createdOrderId
      ) {
        setMessage(
          "La commande a été créée, mais son identifiant serveur n’a pas été retourné correctement. Votre panier n’a pas été vidé.",
        );

        return;
      }


      /**
       * La commande existe maintenant réellement et son identifiant
       * serveur est disponible.
       *
       * On peut retirer le brouillon temporaire.
       */
      window.sessionStorage.removeItem(
        PUBLIC_COMMANDE_PAYMENT_DRAFT_STORAGE_KEY,
      );


      /**
       * Le Panier public ne doit être vidé qu'APRÈS succès serveur.
       */
      panierActions.clear();


      /**
       * La page succès relira la vraie commande en base depuis orderId.
       *
       * Ce paramètre n'est qu'un identifiant de recherche :
       * il ne prouve ni le paiement ni le statut de la commande.
       */
      router.replace(
        buildSuccessRoute(
          createdOrderId,
        ),
      );
    } catch {
      setMessage(
        "Impossible de finaliser votre commande actuellement. Réessayez dans quelques instants.",
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }


  /* =========================================================================
     LOADING
     ========================================================================= */

  if (
    viewStatus ===
    "LOADING"
  ) {
    return (
      <main
        className={
          styles.paymentPage
        }
        data-public-payment-page="true"
      >
        <div
          className={
            styles.paymentContainer
          }
        >
          <div
            className={
              styles.paymentLoading
            }
            aria-live="polite"
            aria-busy="true"
          >
            <LoaderCircle
              className={
                styles.paymentSpinner
              }
              size={
                32
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <strong>
              Vérification de votre commande…
            </strong>

            <p>
              Prix, stock, livraison et total sont revérifiés
              avant de poursuivre.
            </p>
          </div>
        </div>
      </main>
    );
  }


  /* =========================================================================
     ERREUR
     ========================================================================= */

  if (
    viewStatus ===
      "ERROR" ||
    checkout ===
      null ||
    checkoutInput ===
      null
  ) {
    return (
      <main
        className={
          styles.paymentPage
        }
        data-public-payment-page="true"
      >
        <div
          className={
            styles.paymentContainer
          }
        >
          <section
            className={
              styles.paymentErrorState
            }
          >
            <div
              className={
                styles.paymentErrorIcon
              }
              aria-hidden="true"
            >
              <CircleAlert
                size={
                  34
                }
                strokeWidth={
                  1.7
                }
              />
            </div>


            <h1>
              Paiement indisponible
            </h1>


            <p>
              {message ??
                "Votre commande doit être vérifiée de nouveau avant de continuer."}
            </p>


            <div
              className={
                styles.paymentErrorActions
              }
            >
              <button
                type="button"
                className={
                  styles.paymentSecondaryButton
                }
                onClick={
                  handleRetry
                }
              >
                <RefreshCcw
                  size={
                    17
                  }
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />

                Réessayer
              </button>


              <Link
                href={
                  generalAppRoutes.checkout
                }
                className={
                  styles.paymentPrimaryLink
                }
              >
                <ArrowLeft
                  size={
                    17
                  }
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />

                Revenir à la commande
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }


  /* =========================================================================
     PAGE
     ========================================================================= */

  return (
    <main
      className={
        styles.paymentPage
      }
      data-public-payment-page="true"
    >
      <div
        className={
          styles.paymentContainer
        }
      >
        {/* ==================================================================
            RETOUR
            ================================================================== */}

        <div
          className={
            styles.paymentBackRow
          }
        >
          <Link
            href={
              generalAppRoutes.checkout
            }
            className={
              styles.paymentBackLink
            }
          >
            <ArrowLeft
              size={
                17
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            Retour aux informations
          </Link>
        </div>


        {/* ==================================================================
            HEADER
            ================================================================== */}

        <header
          className={
            styles.paymentHeader
          }
        >
          <div>
            <p
              className={
                styles.paymentEyebrow
              }
            >
              Étape finale
            </p>


            <h1
              className={
                styles.paymentTitle
              }
            >
              Paiement
            </h1>


            <p
              className={
                styles.paymentDescription
              }
            >
              Vérifiez une dernière fois votre commande puis
              choisissez votre mode de paiement.
            </p>
          </div>


          <div
            className={
              styles.paymentSecurity
            }
          >
            <ShieldCheck
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <div>
              <strong>
                Vérification serveur active
              </strong>

              <span>
                Les montants sont recalculés avant la création
                de votre commande.
              </span>
            </div>
          </div>
        </header>


        {/* ==================================================================
            MESSAGE
            ================================================================== */}

        {message ? (
          <div
            className={
              styles.paymentAlert
            }
            role="alert"
          >
            <AlertCircle
              size={
                20
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <p>
              {message}
            </p>
          </div>
        ) : null}


        {/* ==================================================================
            LAYOUT
            ================================================================== */}

        <div
          className={
            styles.paymentLayout
          }
        >
          {/* ================================================================
              COLONNE PRINCIPALE
              ================================================================ */}

          <div
            className={
              styles.paymentMainColumn
            }
          >
            {/* ==============================================================
                MODES DE PAIEMENT
                ============================================================== */}

            <section
              className={
                styles.paymentSection
              }
              aria-labelledby="public-payment-method-title"
            >
              <div
                className={
                  styles.paymentSectionHeader
                }
              >
                <div
                  className={
                    styles.paymentSectionIcon
                  }
                  aria-hidden="true"
                >
                  <WalletCards
                    size={
                      21
                    }
                    strokeWidth={
                      1.8
                    }
                  />
                </div>


                <div>
                  <p
                    className={
                      styles.paymentSectionStep
                    }
                  >
                    Mode de paiement
                  </p>

                  <h2
                    id="public-payment-method-title"
                    className={
                      styles.paymentSectionTitle
                    }
                  >
                    Comment souhaitez-vous payer ?
                  </h2>

                  <p
                    className={
                      styles.paymentSectionDescription
                    }
                  >
                    Choisissez parmi les moyens actuellement
                    disponibles pour cette commande.
                  </p>
                </div>
              </div>


              <div
                className={
                  styles.paymentMethods
                }
              >
                {/* ==========================================================
                    CASH ON DELIVERY
                    ========================================================== */}

                <button
                  type="button"
                  className={
                    selection.mode ===
                    "CASH_ON_DELIVERY"
                      ? `${styles.paymentMethodCard} ${styles.paymentMethodCardActive}`
                      : styles.paymentMethodCard
                  }
                  onClick={
                    handleSelectCashOnDelivery
                  }
                  disabled={
                    isSubmitting
                  }
                  aria-pressed={
                    selection.mode ===
                    "CASH_ON_DELIVERY"
                  }
                >
                  <div
                    className={
                      styles.paymentMethodIcon
                    }
                  >
                    <Banknote
                      size={
                        25
                      }
                      strokeWidth={
                        1.7
                      }
                      aria-hidden="true"
                    />
                  </div>


                  <div
                    className={
                      styles.paymentMethodContent
                    }
                  >
                    <div
                      className={
                        styles.paymentMethodTitleRow
                      }
                    >
                      <strong>
                        Paiement à la livraison
                      </strong>

                      {selection.mode ===
                      "CASH_ON_DELIVERY" ? (
                        <CheckCircle2
                          size={
                            19
                          }
                          strokeWidth={
                            2
                          }
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>


                    <p>
                      Passez votre commande maintenant et réglez
                      le montant lors de la livraison.
                    </p>


                    <span
                      className={
                        styles.paymentMethodBadge
                      }
                    >
                      Disponible
                    </span>
                  </div>
                </button>


                {/* ==========================================================
                    ONLINE
                    ========================================================== */}

                <div
                  className={
                    `${styles.paymentMethodCard} ${styles.paymentMethodCardDisabled}`
                  }
                  aria-disabled="true"
                >
                  <div
                    className={
                      styles.paymentMethodIcon
                    }
                  >
                    <CreditCard
                      size={
                        25
                      }
                      strokeWidth={
                        1.7
                      }
                      aria-hidden="true"
                    />
                  </div>


                  <div
                    className={
                      styles.paymentMethodContent
                    }
                  >
                    <div
                      className={
                        styles.paymentMethodTitleRow
                      }
                    >
                      <strong>
                        Paiement en ligne
                      </strong>

                      <Clock3
                        size={
                          18
                        }
                        strokeWidth={
                          1.8
                        }
                        aria-hidden="true"
                      />
                    </div>


                    <p>
                      Carte bancaire ou Mobile Money seront
                      proposés uniquement lorsqu’un véritable
                      fournisseur de paiement sera configuré.
                    </p>


                    <span
                      className={
                        styles.paymentMethodBadgeDisabled
                      }
                    >
                      Indisponible actuellement
                    </span>
                  </div>
                </div>
              </div>


              {/* ============================================================
                  INFORMATION COD
                  ============================================================ */}

              {selection.mode ===
              "CASH_ON_DELIVERY" ? (
                <div
                  className={
                    styles.paymentMethodNotice
                  }
                >
                  <Banknote
                    size={
                      18
                    }
                    strokeWidth={
                      1.8
                    }
                    aria-hidden="true"
                  />

                  <div>
                    <strong>
                      Aucun débit en ligne
                    </strong>

                    <p>
                      Votre commande sera créée avec un montant
                      à payer. Elle ne sera pas marquée comme payée.
                    </p>
                  </div>
                </div>
              ) : null}
            </section>


            {/* ==============================================================
                LIVRAISON
                ============================================================== */}

            <section
              className={
                styles.paymentSection
              }
              aria-labelledby="public-payment-delivery-title"
            >
              <div
                className={
                  styles.paymentSectionHeader
                }
              >
                <div
                  className={
                    styles.paymentSectionIcon
                  }
                  aria-hidden="true"
                >
                  <Truck
                    size={
                      21
                    }
                    strokeWidth={
                      1.8
                    }
                  />
                </div>


                <div>
                  <p
                    className={
                      styles.paymentSectionStep
                    }
                  >
                    Livraison
                  </p>

                  <h2
                    id="public-payment-delivery-title"
                    className={
                      styles.paymentSectionTitle
                    }
                  >
                    Adresse de livraison
                  </h2>
                </div>
              </div>


              <div
                className={
                  styles.paymentDeliveryCard
                }
              >
                <MapPin
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
                    {checkout.customer.firstName}{" "}
                    {checkout.customer.lastName}
                  </strong>


                  <p>
                    {checkout.address.address}
                  </p>


                  {checkout.address.addressComplement ? (
                    <p>
                      {checkout.address.addressComplement}
                    </p>
                  ) : null}


                  <p>
                    {checkout.address.postalCode}{" "}
                    {checkout.address.city}
                  </p>


                  <p>
                    {checkout.address.countryName}
                  </p>


                  <span>
                    {checkout.customer.phone}
                  </span>
                </div>
              </div>
            </section>


            {/* ==============================================================
                CONTACT
                ============================================================== */}

            <section
              className={
                styles.paymentContactSection
              }
            >
              <Mail
                size={
                  18
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <div>
                <strong>
                  Confirmation par e-mail
                </strong>

                <p>
                  La confirmation de commande sera envoyée à{" "}
                  <span>
                    {checkout.customer.email}
                  </span>.
                </p>
              </div>
            </section>


            {/* ==============================================================
                ACTION MOBILE / PRINCIPALE
                ============================================================== */}

            <div
              className={
                styles.paymentActions
              }
            >
              <button
                type="button"
                className={
                  styles.paymentSubmitButton
                }
                disabled={
                  isSubmitting ||
                  selection.mode !==
                    "CASH_ON_DELIVERY"
                }
                onClick={
                  () => {
                    void handleSubmit();
                  }
                }
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className={
                        styles.paymentSpinner
                      }
                      size={
                        19
                      }
                      strokeWidth={
                        1.8
                      }
                      aria-hidden="true"
                    />

                    Création de la commande…
                  </>
                ) : (
                  <>
                    <span>
                      Passer la commande
                    </span>

                    <ArrowRight
                      size={
                        19
                      }
                      strokeWidth={
                        1.9
                      }
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>


              <div
                className={
                  styles.paymentActionSecurity
                }
              >
                <LockKeyhole
                  size={
                    15
                  }
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />

                <span>
                  La commande est revérifiée côté serveur
                  avant sa création.
                </span>
              </div>
            </div>
          </div>


          {/* ================================================================
              RÉSUMÉ
              ================================================================ */}

          <aside
            className={
              styles.paymentSummary
            }
            aria-labelledby="public-payment-summary-title"
          >
            <div
              className={
                styles.paymentSummaryHeader
              }
            >
              <div
                className={
                  styles.paymentSummaryHeaderIcon
                }
                aria-hidden="true"
              >
                <ReceiptText
                  size={
                    21
                  }
                  strokeWidth={
                    1.8
                  }
                />
              </div>


              <div>
                <p
                  className={
                    styles.paymentSummaryEyebrow
                  }
                >
                  Votre commande
                </p>

                <h2
                  id="public-payment-summary-title"
                  className={
                    styles.paymentSummaryTitle
                  }
                >
                  Récapitulatif
                </h2>
              </div>
            </div>


            <div
              className={
                styles.paymentSummaryCount
              }
            >
              <ShoppingBag
                size={
                  16
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <span>
                {formatQuantity(
                  totalQuantity,
                )}
              </span>
            </div>


            <div
              className={
                styles.paymentProducts
              }
            >
              {checkout.snapshot.items.map(
                (
                  item,
                ) => (
                  <PaymentProductItem
                    key={
                      item.storeProductId
                    }
                    item={
                      item
                    }
                  />
                ),
              )}
            </div>


            <div
              className={
                styles.paymentSummaryDelivery
              }
            >
              <PackageCheck
                size={
                  17
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <div>
                <strong>
                  Livraison confirmée
                </strong>

                <span>
                  {checkout.delivery.countryName}
                </span>
              </div>
            </div>


            <div
              className={
                styles.paymentFinancial
              }
            >
              <PaymentFinancialRow
                label="Sous-total produits"
                value={
                  formatMoney(
                    checkout.summary.productsSubtotal,
                  )
                }
              />


              <PaymentFinancialRow
                label="Livraison"
                value={
                  formatMoney(
                    checkout.summary.delivery,
                  )
                }
              />


              <div
                className={
                  styles.paymentFinancialDivider
                }
                aria-hidden="true"
              />


              <PaymentFinancialRow
                label="Total"
                value={
                  formatMoney(
                    total,
                  )
                }
                total={
                  true
                }
              />
            </div>


            <div
              className={
                styles.paymentSummaryPaymentState
              }
            >
              <Smartphone
                size={
                  17
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <div>
                <span>
                  Mode choisi
                </span>

                <strong>
                  Paiement à la livraison
                </strong>
              </div>
            </div>


            <div
              className={
                styles.paymentSummarySecurity
              }
            >
              <ShieldCheck
                size={
                  16
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
              />

              <p>
                Le total affiché provient de la dernière
                vérification serveur.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}