import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import type {
  PublicSuccessData,
  PublicSuccessMoney,
  PublicSuccessPageState,
  PublicSuccessPaymentState,
  PublicSuccessQueryResult,
} from "@/lib/public/commande/public-success-query";

import "./public-success.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — SUCCÈS COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicSuccessPage.tsx
 *
 * Route :
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * - afficher le résultat réel d'une commande publique ;
 * - afficher le vrai numéro de commande ;
 * - afficher les vrais montants ;
 * - afficher le vrai état de paiement ;
 * - afficher les vraies lignes de commande ;
 * - afficher le vrai Receipt lorsqu'il existe ;
 * - afficher le vrai état de livraison lorsqu'il existe ;
 * - gérer proprement :
 *
 *   SUCCESS
 *   PENDING
 *   FAILED
 *   CANCELLED
 *   REFUNDED
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne lit jamais localStorage ;
 * - ne lit jamais sessionStorage ;
 * - ne lit jamais Prisma ;
 * - ne décide jamais qu'un paiement est réussi ;
 * - ne modifie jamais Order ;
 * - ne modifie jamais Payment ;
 * - ne modifie jamais Receipt ;
 * - ne modifie jamais Shipment ;
 * - ne génère pas le reçu PDF ;
 * - n'envoie pas d'e-mail ;
 * - n'invente aucune donnée.
 *
 * Toute la donnée métier provient exclusivement de :
 *
 * src/lib/public/commande/public-success-query.ts
 *
 * ============================================================================
 *
 * SHELL PUBLIC :
 *
 * Header / footer desktop / navigation mobile sont déjà gérés par :
 *
 * src/app/(public)/layout.tsx
 *
 * Ce composant ne recrée donc aucun shell parallèle.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

export interface PublicSuccessPageProps {
  readonly result:
    PublicSuccessQueryResult;
}


/* ==========================================================================
   2. TYPES INTERNES
   ========================================================================== */

type PublicSuccessTone =
  | "success"
  | "pending"
  | "danger"
  | "neutral";


interface PublicSuccessHeroContent {
  readonly tone:
    PublicSuccessTone;

  readonly eyebrow:
    string;

  readonly title:
    string;

  readonly description:
    string;
}


interface PublicSuccessProgressStep {
  readonly id:
    string;

  readonly label:
    string;

  readonly description:
    string;

  readonly state:
    "DONE" |
    "CURRENT" |
    "UPCOMING";
}


/* ==========================================================================
   3. NORMALISATION
   ========================================================================== */

function normalizeText(
  value:
    string |
    null |
    undefined,
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
   4. MONEY
   ========================================================================== */

function formatPublicSuccessMoney(
  money:
    PublicSuccessMoney,
): string {
  const amount =
    Number(
      money.amount,
    );


  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return `${money.amount} ${money.currency}`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          money.currency,

        minimumFractionDigits:
          Number.isInteger(
            amount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    );
  } catch {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        minimumFractionDigits:
          Number.isInteger(
            amount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    )} ${money.currency}`;
  }
}


function isZeroMoney(
  money:
    PublicSuccessMoney,
): boolean {
  const amount =
    Number(
      money.amount,
    );


  return (
    Number.isFinite(
      amount,
    ) &&
    amount ===
      0
  );
}


/* ==========================================================================
   5. DATE
   ========================================================================== */

function formatPublicSuccessDate(
  value:
    Date |
    null,
): string {
  if (
    !value ||
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return "—";
  }


  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle:
          "long",

        timeStyle:
          "short",
      },
    ).format(
      value,
    );
  } catch {
    return value.toISOString();
  }
}


/* ==========================================================================
   6. HERO CONTENT
   ========================================================================== */

function getPublicSuccessHeroContent(
  state:
    PublicSuccessPageState,
): PublicSuccessHeroContent {
  switch (
    state
  ) {
    case "SUCCESS":
      return {
        tone:
          "success",

        eyebrow:
          "Commande enregistrée",

        title:
          "Commande confirmée !",

        description:
          "Votre commande a bien été enregistrée dans notre système.",
      };


    case "PENDING":
      return {
        tone:
          "pending",

        eyebrow:
          "Confirmation en cours",

        title:
          "Votre commande est en cours de confirmation",

        description:
          "La commande existe bien, mais sa confirmation finale est encore en attente.",
      };


    case "FAILED":
      return {
        tone:
          "danger",

        eyebrow:
          "Paiement non confirmé",

        title:
          "Le paiement n’a pas été confirmé",

        description:
          "La commande existe, mais la dernière tentative de paiement n’a pas abouti.",
      };


    case "CANCELLED":
      return {
        tone:
          "danger",

        eyebrow:
          "Commande annulée",

        title:
          "Cette commande a été annulée",

        description:
          "La commande est enregistrée comme annulée dans notre système.",
      };


    case "REFUNDED":
      return {
        tone:
          "neutral",

        eyebrow:
          "Commande remboursée",

        title:
          "Cette commande a été remboursée",

        description:
          "Le statut actuel de cette commande indique un remboursement.",
      };
  }
}


/* ==========================================================================
   7. PROGRESSION COMMANDE
   ========================================================================== */

function getPublicSuccessOrderProgress(
  data:
    PublicSuccessData,
): readonly PublicSuccessProgressStep[] {
  const status =
    data.order.status;


  const confirmationDone =
    Boolean(
      data.order.confirmedAt,
    ) ||
    status ===
      "CONFIRMED" ||
    status ===
      "PROCESSING" ||
    status ===
      "READY" ||
    status ===
      "SHIPPED" ||
    status ===
      "DELIVERED";


  const preparationDone =
    status ===
      "READY" ||
    status ===
      "SHIPPED" ||
    status ===
      "DELIVERED";


  const preparationCurrent =
    status ===
      "PROCESSING";


  const shipmentDone =
    status ===
      "SHIPPED" ||
    status ===
      "DELIVERED" ||
    data.shipment?.status ===
      "SHIPPED" ||
    data.shipment?.status ===
      "IN_TRANSIT" ||
    data.shipment?.status ===
      "DELIVERED";


  const shipmentCurrent =
    data.shipment?.status ===
      "PREPARING";


  const deliveryDone =
    status ===
      "DELIVERED" ||
    Boolean(
      data.order.deliveredAt,
    ) ||
    data.shipment?.status ===
      "DELIVERED";


  return [
    {
      id:
        "registered",

      label:
        "Commande enregistrée",

      description:
        `Commande ${data.order.orderNumber} enregistrée le ${formatPublicSuccessDate(
          data.order.createdAt,
        )}.`,

      state:
        "DONE",
    },

    {
      id:
        "confirmed",

      label:
        "Confirmation de la commande",

      description:
        confirmationDone
          ? "La commande a été confirmée."
          : "La confirmation définitive est encore en attente.",

      state:
        confirmationDone
          ? "DONE"
          : "CURRENT",
    },

    {
      id:
        "preparation",

      label:
        "Préparation",

      description:
        preparationDone
          ? "La phase de préparation est terminée."
          : preparationCurrent
            ? "La commande est actuellement en préparation."
            : "La préparation commencera après confirmation.",

      state:
        preparationDone
          ? "DONE"
          : preparationCurrent
            ? "CURRENT"
            : "UPCOMING",
    },

    {
      id:
        "shipment",

      label:
        "Expédition",

      description:
        shipmentDone
          ? data.shipment?.trackingNumber
            ? `Expédition enregistrée — suivi ${data.shipment.trackingNumber}.`
            : "L’expédition de la commande a été enregistrée."
          : shipmentCurrent
            ? "La livraison est actuellement en préparation."
            : "L’expédition n’a pas encore été enregistrée.",

      state:
        shipmentDone
          ? "DONE"
          : shipmentCurrent
            ? "CURRENT"
            : "UPCOMING",
    },

    {
      id:
        "delivery",

      label:
        "Livraison",

      description:
        deliveryDone
          ? `Livraison enregistrée${
              data.order.deliveredAt
                ? ` le ${formatPublicSuccessDate(
                    data.order.deliveredAt,
                  )}`
                : ""
            }.`
          : "La livraison n’est pas encore marquée comme terminée.",

      state:
        deliveryDone
          ? "DONE"
          : shipmentDone
            ? "CURRENT"
            : "UPCOMING",
    },
  ];
}


/* ==========================================================================
   8. PAIEMENT — TON
   ========================================================================== */

function getPaymentTone(
  state:
    PublicSuccessPaymentState,
): PublicSuccessTone {
  switch (
    state
  ) {
    case "PAID":
      return "success";

    case "PENDING":
      return "pending";

    case "FAILED":
      return "danger";

    case "REFUNDED":
      return "neutral";

    case "TO_PAY":
      return "pending";
  }
}


/* ==========================================================================
   9. HERO ICON
   ========================================================================== */

function PublicSuccessHeroIcon({
  state,
}: {
  readonly state:
    PublicSuccessPageState;
}) {
  switch (
    state
  ) {
    case "SUCCESS":
      return (
        <CheckCircle2
          size={42}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );


    case "PENDING":
      return (
        <Clock3
          size={42}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );


    case "FAILED":
    case "CANCELLED":
      return (
        <XCircle
          size={42}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );


    case "REFUNDED":
      return (
        <RotateCcw
          size={42}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );
  }
}


/* ==========================================================================
   10. ÉTAT ERREUR
   ========================================================================== */

function PublicSuccessErrorState({
  result,
}: {
  readonly result:
    Extract<
      PublicSuccessQueryResult,
      {
        success:
          false;
      }
    >;
}) {
  return (
    <main
      className="le-success-page le-success-error-page"
      aria-labelledby="public-success-error-title"
    >
      <section
        className="le-success-error-card"
        role="status"
      >
        <span
          className="le-success-error-icon"
          aria-hidden="true"
        >
          <AlertCircle
            size={42}
            strokeWidth={1.8}
          />
        </span>

        <p className="le-success-eyebrow">
          Commande
        </p>

        <h1
          id="public-success-error-title"
          className="le-success-error-title"
        >
          Impossible d’afficher cette commande
        </h1>

        <p className="le-success-error-description">
          {result.message}
        </p>

        <div className="le-success-error-actions">
          <Link
            href={PUBLIC_NAVIGATION_ROUTES.HOME}
            className="le-success-secondary-button"
          >
            Retour à l’accueil
          </Link>

          <Link
            href={PUBLIC_NAVIGATION_ROUTES.PRODUCTS}
            className="le-success-primary-button"
          >
            Voir les produits

            <ArrowRight
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

    </main>
  );
}


/* ==========================================================================
   11. CARTE INFORMATION
   ========================================================================== */

function PublicSuccessInfoRow({
  label,
  value,
  strong = false,
}: {
  readonly label:
    string;

  readonly value:
    string;

  readonly strong?:
    boolean;
}) {
  return (
    <div className="le-success-info-row">
      <dt>
        {label}
      </dt>

      <dd
        className={
          strong
            ? "le-success-info-value le-success-info-value-strong"
            : "le-success-info-value"
        }
      >
        {value}
      </dd>
    </div>
  );
}


/* ==========================================================================
   12. PAGE SUCCESS
   ========================================================================== */

export default function PublicSuccessPage({
  result,
}: PublicSuccessPageProps) {
  if (
    !result.success
  ) {
    return (
      <PublicSuccessErrorState
        result={result}
      />
    );
  }


  const data =
    result.data;


  const hero =
    getPublicSuccessHeroContent(
      data.pageState,
    );


  const paymentTone =
    getPaymentTone(
      data.payment.state,
    );


  const progress =
    getPublicSuccessOrderProgress(
      data,
    );


  const deliveryLocation =
    [
      normalizeText(
        data.delivery.city,
      ),
      normalizeText(
        data.delivery.country,
      ),
    ]
      .filter(
        (
          value,
        ): value is string =>
          Boolean(
            value,
          ),
      )
      .join(
        ", ",
      );


  const showProgress =
    data.pageState ===
      "SUCCESS" ||
    data.pageState ===
      "PENDING";


  const emailSent =
    Boolean(
      data.receipt
        ?.emailedAt,
    );


  return (
    <main
      className="le-success-page"
      aria-labelledby="public-success-title"
    >
      {/* ====================================================================
          HERO
          ==================================================================== */}

      <section
        className={`le-success-hero le-success-tone-${hero.tone}`}
      >
        <div className="le-success-hero-inner">
          <div
            className="le-success-hero-icon"
            aria-hidden="true"
          >
            <PublicSuccessHeroIcon
              state={data.pageState}
            />
          </div>

          <p className="le-success-eyebrow">
            {hero.eyebrow}
          </p>

          <h1
            id="public-success-title"
            className="le-success-title"
          >
            {hero.title}
          </h1>

          <p className="le-success-description">
            {hero.description}
          </p>

          <div className="le-success-reference-card">
            <div className="le-success-reference-block">
              <span className="le-success-reference-label">
                Référence de la commande
              </span>

              <strong className="le-success-reference-number">
                {data.order.orderNumber}
              </strong>
            </div>

            <div className="le-success-reference-separator" />

            <div className="le-success-reference-block">
              <span className="le-success-reference-label">
                Date de la commande
              </span>

              <strong className="le-success-reference-value">
                {formatPublicSuccessDate(
                  data.order.createdAt,
                )}
              </strong>
            </div>

            <div className="le-success-reference-separator" />

            <div className="le-success-reference-block">
              <span className="le-success-reference-label">
                Montant total
              </span>

              <strong className="le-success-reference-total">
                {formatPublicSuccessMoney(
                  data.order.total,
                )}
              </strong>
            </div>

            <div className="le-success-reference-separator" />

            <div className="le-success-reference-block">
              <span className="le-success-reference-label">
                Paiement
              </span>

              <strong className="le-success-reference-value">
                {data.payment.methodLabel}
              </strong>
            </div>
          </div>
        </div>
      </section>


      {/* ====================================================================
          CONTENU
          ==================================================================== */}

      <section className="le-success-content">
        <div className="le-success-layout">
          {/* ================================================================
              COLONNE PRINCIPALE
              ================================================================ */}

          <div className="le-success-main-column">
            {/* ==============================================================
                ÉTAT COMMANDE + PAIEMENT
                ============================================================== */}

            <section
              className="le-success-card"
              aria-labelledby="public-success-order-heading"
            >
              <div className="le-success-card-heading">
                <div>
                  <span className="le-success-card-kicker">
                    État actuel
                  </span>

                  <h2
                    id="public-success-order-heading"
                    className="le-success-card-title"
                  >
                    Votre commande
                  </h2>
                </div>

                <span
                  className={`le-success-status-badge le-success-tone-${hero.tone}`}
                >
                  {data.order.statusLabel}
                </span>
              </div>

              <dl className="le-success-info-list">
                <PublicSuccessInfoRow
                  label="Commande"
                  value={data.order.orderNumber}
                  strong
                />

                <PublicSuccessInfoRow
                  label="Statut"
                  value={data.order.statusLabel}
                />

                <PublicSuccessInfoRow
                  label="Articles"
                  value={`${data.order.itemsCount} ${
                    data.order.itemsCount > 1
                      ? "articles"
                      : "article"
                  }`}
                />

                <PublicSuccessInfoRow
                  label="Lignes produit"
                  value={String(
                    data.order.linesCount,
                  )}
                />

                {data.order.confirmedAt ? (
                  <PublicSuccessInfoRow
                    label="Confirmation"
                    value={formatPublicSuccessDate(
                      data.order.confirmedAt,
                    )}
                  />
                ) : null}
              </dl>

              <div className="le-success-payment-panel">
                <div className="le-success-payment-heading">
                  <div className="le-success-payment-icon">
                    <ReceiptText
                      size={20}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <span className="le-success-payment-caption">
                      Paiement
                    </span>

                    <strong className="le-success-payment-method">
                      {data.payment.methodLabel}
                    </strong>
                  </div>

                  <span
                    className={`le-success-payment-state le-success-tone-${paymentTone}`}
                  >
                    {data.payment.stateLabel}
                  </span>
                </div>

                {data.payment.reference ? (
                  <div className="le-success-payment-reference">
                    <span>
                      Référence
                    </span>

                    <strong>
                      {data.payment.reference}
                    </strong>
                  </div>
                ) : null}

                {data.payment.amount ? (
                  <div className="le-success-payment-reference">
                    <span>
                      Montant
                    </span>

                    <strong>
                      {formatPublicSuccessMoney(
                        data.payment.amount,
                      )}
                    </strong>
                  </div>
                ) : null}

                {data.payment.paidAt ? (
                  <div className="le-success-payment-reference">
                    <span>
                      Paiement enregistré
                    </span>

                    <strong>
                      {formatPublicSuccessDate(
                        data.payment.paidAt,
                      )}
                    </strong>
                  </div>
                ) : null}
              </div>
            </section>


            {/* ==============================================================
                PROGRESSION
                ============================================================== */}

            {showProgress ? (
              <section
                className="le-success-card"
                aria-labelledby="public-success-progress-heading"
              >
                <div className="le-success-card-heading">
                  <div>
                    <span className="le-success-card-kicker">
                      Suivi
                    </span>

                    <h2
                      id="public-success-progress-heading"
                      className="le-success-card-title"
                    >
                      Que se passe-t-il ensuite ?
                    </h2>
                  </div>
                </div>

                <ol className="le-success-progress-list">
                  {progress.map(
                    (
                      step,
                      index,
                    ) => (
                      <li
                        key={step.id}
                        className={`le-success-progress-item le-success-progress-${step.state}`}
                      >
                        <div className="le-success-progress-marker-column">
                          <span className="le-success-progress-marker">
                            {step.state ===
                            "DONE" ? (
                              <Check
                                size={16}
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            ) : (
                              index +
                              1
                            )}
                          </span>

                          {index <
                          progress.length -
                            1 ? (
                            <span className="le-success-progress-line" />
                          ) : null}
                        </div>

                        <div className="le-success-progress-content">
                          <strong>
                            {step.label}
                          </strong>

                          <p>
                            {step.description}
                          </p>
                        </div>
                      </li>
                    ),
                  )}
                </ol>
              </section>
            ) : null}


            {/* ==============================================================
                PRODUITS
                ============================================================== */}

            <section
              className="le-success-card"
              aria-labelledby="public-success-products-heading"
            >
              <div className="le-success-card-heading">
                <div>
                  <span className="le-success-card-kicker">
                    Articles
                  </span>

                  <h2
                    id="public-success-products-heading"
                    className="le-success-card-title"
                  >
                    Produits commandés
                  </h2>
                </div>

                <span className="le-success-count">
                  {data.order.itemsCount}
                </span>
              </div>

              <div className="le-success-products-list">
                {data.items.map(
                  (
                    item,
                  ) => (
                    <article
                      key={item.id}
                      className="le-success-product-row"
                    >
                      <div
                        className="le-success-product-icon"
                        aria-hidden="true"
                      >
                        <ShoppingBag
                          size={22}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div className="le-success-product-info">
                        <strong className="le-success-product-name">
                          {item.productName}
                        </strong>

                        <div className="le-success-product-meta">
                          {item.sku ? (
                            <span>
                              Réf. {item.sku}
                            </span>
                          ) : null}

                          <span>
                            Quantité : {item.quantity}
                          </span>

                          <span>
                            {formatPublicSuccessMoney(
                              item.unitPrice,
                            )}{" "}
                            / unité
                          </span>
                        </div>
                      </div>

                      <strong className="le-success-product-total">
                        {formatPublicSuccessMoney(
                          item.total,
                        )}
                      </strong>
                    </article>
                  ),
                )}
              </div>
            </section>
          </div>


          {/* ================================================================
              SIDEBAR
              ================================================================ */}

          <aside className="le-success-side-column">
            {/* ==============================================================
                RÉSUMÉ FINANCIER
                ============================================================== */}

            <section
              className="le-success-card le-success-summary-card"
              aria-labelledby="public-success-summary-heading"
            >
              <div className="le-success-card-heading">
                <div>
                  <span className="le-success-card-kicker">
                    Récapitulatif
                  </span>

                  <h2
                    id="public-success-summary-heading"
                    className="le-success-card-title"
                  >
                    Montant de la commande
                  </h2>
                </div>
              </div>

              <dl className="le-success-totals">
                <div>
                  <dt>
                    Sous-total produits
                  </dt>

                  <dd>
                    {formatPublicSuccessMoney(
                      data.order.productsSubtotal,
                    )}
                  </dd>
                </div>

                {!isZeroMoney(
                  data.order.discountAmount,
                ) ? (
                  <div>
                    <dt>
                      Réduction
                    </dt>

                    <dd>
                      −{" "}
                      {formatPublicSuccessMoney(
                        data.order.discountAmount,
                      )}
                    </dd>
                  </div>
                ) : null}

                <div>
                  <dt>
                    Livraison
                  </dt>

                  <dd>
                    {isZeroMoney(
                      data.order.shippingAmount,
                    )
                      ? "0"
                      : formatPublicSuccessMoney(
                          data.order.shippingAmount,
                        )}
                  </dd>
                </div>

                {!isZeroMoney(
                  data.order.taxAmount,
                ) ? (
                  <div>
                    <dt>
                      Taxes
                    </dt>

                    <dd>
                      {formatPublicSuccessMoney(
                        data.order.taxAmount,
                      )}
                    </dd>
                  </div>
                ) : null}

                <div className="le-success-grand-total">
                  <dt>
                    Total
                  </dt>

                  <dd>
                    {formatPublicSuccessMoney(
                      data.order.total,
                    )}
                  </dd>
                </div>
              </dl>
            </section>


            {/* ==============================================================
                LIVRAISON
                ============================================================== */}

            <section
              className="le-success-card"
              aria-labelledby="public-success-delivery-heading"
            >
              <div className="le-success-card-heading">
                <div>
                  <span className="le-success-card-kicker">
                    Livraison
                  </span>

                  <h2
                    id="public-success-delivery-heading"
                    className="le-success-card-title"
                  >
                    Destination
                  </h2>
                </div>

                <MapPin
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <div className="le-success-delivery-content">
                {data.delivery.recipientName ? (
                  <strong className="le-success-delivery-recipient">
                    {data.delivery.recipientName}
                  </strong>
                ) : null}

                {deliveryLocation ? (
                  <span>
                    {deliveryLocation}
                  </span>
                ) : (
                  <span>
                    Destination enregistrée sur la commande
                  </span>
                )}

                {data.delivery.postalCode ? (
                  <span>
                    Code postal : {data.delivery.postalCode}
                  </span>
                ) : null}
              </div>

              {data.shipment ? (
                <div className="le-success-shipment">
                  <div className="le-success-shipment-icon">
                    {data.shipment.status ===
                    "DELIVERED" ? (
                      <PackageCheck
                        size={20}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    ) : data.shipment.status ===
                        "SHIPPED" ||
                      data.shipment.status ===
                        "IN_TRANSIT" ? (
                      <Truck
                        size={20}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    ) : (
                      <PackageOpen
                        size={20}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="le-success-shipment-content">
                    <strong>
                      {data.shipment.statusLabel}
                    </strong>

                    <span>
                      {data.shipment.shipmentNumber}
                    </span>

                    {data.shipment.carrier ? (
                      <span>
                        Transporteur : {data.shipment.carrier}
                      </span>
                    ) : null}

                    {data.shipment.trackingNumber ? (
                      <span>
                        Suivi : {data.shipment.trackingNumber}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>


            {/* ==============================================================
                REÇU / EMAIL
                ============================================================== */}

            {data.receipt ? (
              <section
                className="le-success-card"
                aria-labelledby="public-success-receipt-heading"
              >
                <div className="le-success-card-heading">
                  <div>
                    <span className="le-success-card-kicker">
                      Document
                    </span>

                    <h2
                      id="public-success-receipt-heading"
                      className="le-success-card-title"
                    >
                      Reçu de commande
                    </h2>
                  </div>

                  <ReceiptText
                    size={20}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </div>

                <dl className="le-success-info-list">
                  <PublicSuccessInfoRow
                    label="Reçu"
                    value={data.receipt.receiptNumber}
                    strong
                  />

                  <PublicSuccessInfoRow
                    label="Émis le"
                    value={formatPublicSuccessDate(
                      data.receipt.issuedAt,
                    )}
                  />

                  <PublicSuccessInfoRow
                    label="Montant"
                    value={formatPublicSuccessMoney(
                      data.receipt.amount,
                    )}
                  />
                </dl>

                <div className="le-success-receipt-state">
                  <ReceiptText
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <span>
                    {data.receipt.pdfStored
                      ? "Le reçu PDF a été généré et enregistré."
                      : "Le reçu est enregistré."}
                  </span>
                </div>

                {emailSent ? (
                  <div className="le-success-email-state">
                    <Mail
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span>
                      E-mail envoyé{" "}
                      {data.customer.maskedEmail
                        ? `à ${data.customer.maskedEmail}`
                        : ""}
                    </span>
                  </div>
                ) : data.customer.hasEmail ? (
                  <div className="le-success-email-state">
                    <Mail
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span>
                      Adresse e-mail enregistrée
                      {data.customer.maskedEmail
                        ? ` : ${data.customer.maskedEmail}`
                        : "."}
                    </span>
                  </div>
                ) : null}
              </section>
            ) : null}
          </aside>
        </div>


        {/* ==================================================================
            ACTIONS
            ================================================================== */}

        <div className="le-success-actions">
          <Link
            href={PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING}
            className="le-success-secondary-button"
          >
            <PackageOpen
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            Suivre une commande
          </Link>

          <Link
  href={PUBLIC_NAVIGATION_ROUTES.PRODUCTS}
  className="le-success-primary-button"
>
  Continuer mes achats

  <ArrowRight
    size={18}
    strokeWidth={2}
    aria-hidden="true"
  />
</Link>
        </div>
      </section>

    </main>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * STYLE :
 *
 * src/components/public/commande/public-success.module.css
 *
 * SOURCE DE VÉRITÉ :
 *
 * src/lib/public/commande/public-success-query.ts
 *
 * SHELL :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 */