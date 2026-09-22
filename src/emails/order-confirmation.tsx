import * as React from "react";

import {
  PUBLIC_SITE,
} from "@/config/public-site";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * E-MAIL PUBLIC — CONFIRMATION DE COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/emails/order-confirmation.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Générer le contenu React de l'e-mail transactionnel envoyé après
 * l'enregistrement réel d'une commande publique.
 *
 * ============================================================================
 *
 * CE FICHIER :
 *
 * - ne lit PAS Prisma ;
 * - ne crée PAS de commande ;
 * - ne modifie PAS de paiement ;
 * - ne modifie PAS de stock ;
 * - ne génère PAS le reçu PDF ;
 * - n'envoie PAS directement l'e-mail ;
 * - ne lit PAS RESEND_API_KEY ;
 * - ne fait confiance à aucune donnée navigateur ;
 * - ne contient aucun secret ;
 * - n'invente aucun prix ;
 * - n'invente aucun statut de paiement ;
 * - n'invente aucune adresse ;
 * - n'invente aucun produit.
 *
 * ============================================================================
 *
 * FLUX :
 *
 * PostgreSQL
 *
 *      ↓
 *
 * public-order-receipt.ts
 * / données réelles commande
 *
 *      ↓
 *
 * public-order-email.ts
 *
 *      ↓
 *
 * order-confirmation.tsx
 *
 *      ↓
 *
 * Resend
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES
   ========================================================================== */

export type OrderConfirmationPaymentState =
  | "TO_PAY"
  | "PENDING"
  | "PAID";


export interface OrderConfirmationMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


export interface OrderConfirmationItem {
  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly quantity:
    number;

  readonly unitPrice:
    OrderConfirmationMoney;

  readonly total:
    OrderConfirmationMoney;

  readonly imageUrl?:
    string | null;
}


export interface OrderConfirmationEmailProps {
  readonly orderNumber:
    string;

  readonly orderDate:
    Date;

  readonly customer: {
    readonly firstName:
      string;

    readonly lastName:
      string;

    readonly email:
      string | null;

    readonly phone:
      string | null;
  };

  readonly delivery: {
    readonly recipientName:
      string | null;

    readonly phone:
      string | null;

    readonly country:
      string | null;

    readonly city:
      string | null;

    readonly address:
      string | null;

    readonly postalCode:
      string | null;
  };

  readonly items:
    readonly OrderConfirmationItem[];

  readonly productsSubtotal:
    OrderConfirmationMoney;

  readonly deliveryAmount:
    OrderConfirmationMoney;

  readonly total:
    OrderConfirmationMoney;

  readonly payment: {
    readonly label:
      string;

    readonly state:
      OrderConfirmationPaymentState;

    readonly stateLabel:
      string;

    readonly reference:
      string | null;
  };

  /**
   * Nom du reçu réellement joint par public-order-email.ts.
   *
   * Si null :
   * aucun message indiquant qu'un PDF est joint
   * ne sera affiché.
   */
  readonly receiptFileName?:
    string | null;
}


/* ==========================================================================
   2. CONSTANTES VISUELLES
   ========================================================================== */

const BRAND_MAGENTA =
  "#E60073";

const BRAND_MAGENTA_DARK =
  "#C40061";

const TEXT_PRIMARY =
  "#171717";

const TEXT_SECONDARY =
  "#666666";

const BORDER_COLOR =
  "#E9E9E9";

const SOFT_BACKGROUND =
  "#FAFAFA";

const PINK_BACKGROUND =
  "#FFF3F8";

const WHITE =
  "#FFFFFF";


/* ==========================================================================
   3. HELPERS TEXTE
   ========================================================================== */

function normalizeText(
  value:
    string |
    null |
    undefined,
): string {
  return value?.trim() ?? "";
}


function getDisplayText(
  value:
    string |
    null |
    undefined,
): string {
  const normalized =
    normalizeText(
      value,
    );

  return normalized ||
    "—";
}


function getCustomerFullName(
  customer:
    OrderConfirmationEmailProps["customer"],
): string {
  const fullName =
    [
      normalizeText(
        customer.firstName,
      ),

      normalizeText(
        customer.lastName,
      ),
    ]
      .filter(Boolean)
      .join(" ");

  return fullName ||
    "Cliente";
}


function getDeliveryRecipientName(
  props:
    OrderConfirmationEmailProps,
): string {
  const recipient =
    normalizeText(
      props.delivery.recipientName,
    );

  if (recipient) {
    return recipient;
  }

  return getCustomerFullName(
    props.customer,
  );
}


function getCountryCityLabel(
  delivery:
    OrderConfirmationEmailProps["delivery"],
): string {
  const location =
    [
      normalizeText(
        delivery.city,
      ),

      normalizeText(
        delivery.country,
      ),
    ]
      .filter(Boolean)
      .join(", ");

  return location ||
    "—";
}


/* ==========================================================================
   4. FORMAT MONÉTAIRE
   ========================================================================== */

function formatMoney(
  money:
    OrderConfirmationMoney,
): string {
  const currency =
    normalizeText(
      money.currency,
    ).toUpperCase();

  const amount =
    Number(
      money.amount,
    );

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return [
      money.amount,
      currency,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const formatted =
    new Intl.NumberFormat(
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
    );

  return `${formatted} ${currency}`;
}


/* ==========================================================================
   5. FORMAT DATE
   ========================================================================== */

function formatOrderDate(
  value:
    Date,
): string {
  if (
    !(
      value instanceof
      Date
    ) ||
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return "—";
  }

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
}


/* ==========================================================================
   6. PAIEMENT
   ========================================================================== */

function getPaymentStateStyle(
  state:
    OrderConfirmationPaymentState,
): React.CSSProperties {
  switch (
    state
  ) {
    case "PAID":
      return {
        backgroundColor:
          "#ECFDF3",

        color:
          "#067647",

        border:
          "1px solid #ABEFC6",
      };

    case "PENDING":
      return {
        backgroundColor:
          "#FFFAEB",

        color:
          "#B54708",

        border:
          "1px solid #FEDF89",
      };

    case "TO_PAY":
    default:
      return {
        backgroundColor:
          "#FFF3F8",

        color:
          BRAND_MAGENTA_DARK,

        border:
          "1px solid #F8BBD5",
      };
  }
}


/* ==========================================================================
   7. STYLES
   ========================================================================== */

const styles = {
  html: {
    margin:
      0,

    padding:
      0,

    backgroundColor:
      "#F4F4F5",
  },

  body: {
    margin:
      0,

    padding:
      "24px 12px",

    backgroundColor:
      "#F4F4F5",

    color:
      TEXT_PRIMARY,

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  preheader: {
    display:
      "none",

    overflow:
      "hidden",

    lineHeight:
      "1px",

    opacity:
      0,

    maxHeight:
      0,

    maxWidth:
      0,

    color:
      "transparent",
  },

  outerTable: {
    width:
      "100%",

    borderCollapse:
      "collapse" as const,

    borderSpacing:
      0,
  },

  containerCell: {
    padding:
      0,
  },

  container: {
    width:
      "100%",

    maxWidth:
      "680px",

    margin:
      "0 auto",

    backgroundColor:
      WHITE,

    border:
      `1px solid ${BORDER_COLOR}`,

    borderRadius:
      "18px",

    overflow:
      "hidden",
  },

  header: {
    padding:
      "30px 34px 26px",

    backgroundColor:
      "#171117",

    textAlign:
      "center" as const,
  },

  brand: {
    margin:
      0,

    color:
      WHITE,

    fontSize:
      "24px",

    lineHeight:
      "30px",

    fontWeight:
      800,

    letterSpacing:
      "-0.4px",
  },

  brandAccent: {
    color:
      "#FF4B9A",
  },

  headerSubtitle: {
    margin:
      "7px 0 0",

    color:
      "#E6DDE2",

    fontSize:
      "13px",

    lineHeight:
      "20px",
  },

  content: {
    padding:
      "32px 34px 18px",
  },

  eyebrow: {
    margin:
      "0 0 7px",

    color:
      BRAND_MAGENTA,

    fontSize:
      "12px",

    lineHeight:
      "18px",

    fontWeight:
      700,

    textTransform:
      "uppercase" as const,

    letterSpacing:
      "0.7px",
  },

  heading: {
    margin:
      "0 0 14px",

    color:
      TEXT_PRIMARY,

    fontSize:
      "26px",

    lineHeight:
      "34px",

    fontWeight:
      800,

    letterSpacing:
      "-0.5px",
  },

  paragraph: {
    margin:
      "0 0 14px",

    color:
      TEXT_SECONDARY,

    fontSize:
      "14px",

    lineHeight:
      "22px",
  },

  referenceBox: {
    margin:
      "22px 0",

    padding:
      "18px 20px",

    borderRadius:
      "12px",

    backgroundColor:
      PINK_BACKGROUND,

    border:
      "1px solid #F4C2D5",
  },

  referenceLabel: {
    margin:
      "0 0 5px",

    color:
      "#805266",

    fontSize:
      "11px",

    lineHeight:
      "16px",

    fontWeight:
      700,

    textTransform:
      "uppercase" as const,

    letterSpacing:
      "0.5px",
  },

  referenceValue: {
    margin:
      0,

    color:
      TEXT_PRIMARY,

    fontSize:
      "20px",

    lineHeight:
      "26px",

    fontWeight:
      800,

    wordBreak:
      "break-word" as const,
  },

  section: {
    marginTop:
      "26px",
  },

  sectionTitle: {
    margin:
      "0 0 12px",

    color:
      TEXT_PRIMARY,

    fontSize:
      "17px",

    lineHeight:
      "24px",

    fontWeight:
      800,
  },

  infoTable: {
    width:
      "100%",

    borderCollapse:
      "collapse" as const,

    borderSpacing:
      0,

    backgroundColor:
      SOFT_BACKGROUND,

    border:
      `1px solid ${BORDER_COLOR}`,

    borderRadius:
      "12px",
  },

  infoCell: {
    width:
      "50%",

    verticalAlign:
      "top" as const,

    padding:
      "16px 18px",
  },

  infoLabel: {
    margin:
      "0 0 4px",

    color:
      "#888888",

    fontSize:
      "11px",

    lineHeight:
      "16px",

    fontWeight:
      700,

    textTransform:
      "uppercase" as const,
  },

  infoValue: {
    margin:
      0,

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "20px",

    wordBreak:
      "break-word" as const,
  },

  productsTable: {
    width:
      "100%",

    borderCollapse:
      "collapse" as const,

    borderSpacing:
      0,

    border:
      `1px solid ${BORDER_COLOR}`,
  },

  productCell: {
    padding:
      "14px",

    verticalAlign:
      "middle" as const,

    borderBottom:
      `1px solid ${BORDER_COLOR}`,
  },

  productName: {
    margin:
      0,

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",

    fontWeight:
      700,
  },

  productMeta: {
    margin:
      "4px 0 0",

    color:
      TEXT_SECONDARY,

    fontSize:
      "11px",

    lineHeight:
      "17px",
  },

  productTotal: {
    margin:
      0,

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",

    fontWeight:
      700,

    textAlign:
      "right" as const,

    whiteSpace:
      "nowrap" as const,
  },

  totalTable: {
    width:
      "100%",

    marginTop:
      "15px",

    borderCollapse:
      "collapse" as const,

    borderSpacing:
      0,
  },

  totalLabelCell: {
    padding:
      "5px 0",

    color:
      TEXT_SECONDARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",
  },

  totalValueCell: {
    padding:
      "5px 0",

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",

    textAlign:
      "right" as const,

    whiteSpace:
      "nowrap" as const,
  },

  grandTotalLabelCell: {
    padding:
      "12px 0 2px",

    borderTop:
      `1px solid ${BORDER_COLOR}`,

    color:
      TEXT_PRIMARY,

    fontSize:
      "16px",

    lineHeight:
      "22px",

    fontWeight:
      800,
  },

  grandTotalValueCell: {
    padding:
      "12px 0 2px",

    borderTop:
      `1px solid ${BORDER_COLOR}`,

    color:
      BRAND_MAGENTA_DARK,

    fontSize:
      "17px",

    lineHeight:
      "22px",

    fontWeight:
      800,

    textAlign:
      "right" as const,

    whiteSpace:
      "nowrap" as const,
  },

  paymentBox: {
    marginTop:
      "25px",

    padding:
      "18px",

    border:
      `1px solid ${BORDER_COLOR}`,

    borderRadius:
      "12px",

    backgroundColor:
      WHITE,
  },

  paymentTable: {
    width:
      "100%",

    borderCollapse:
      "collapse" as const,

    borderSpacing:
      0,
  },

  paymentLabel: {
    padding:
      "4px 0",

    color:
      TEXT_SECONDARY,

    fontSize:
      "12px",

    lineHeight:
      "18px",
  },

  paymentValue: {
    padding:
      "4px 0",

    color:
      TEXT_PRIMARY,

    fontSize:
      "12px",

    lineHeight:
      "18px",

    textAlign:
      "right" as const,

    wordBreak:
      "break-word" as const,
  },

  paymentBadge: {
    display:
      "inline-block",

    padding:
      "5px 9px",

    borderRadius:
      "999px",

    fontSize:
      "11px",

    lineHeight:
      "15px",

    fontWeight:
      700,

    whiteSpace:
      "nowrap" as const,
  },

  attachmentBox: {
    marginTop:
      "22px",

    padding:
      "16px 18px",

    borderRadius:
      "12px",

    backgroundColor:
      "#F8F8F8",

    border:
      `1px solid ${BORDER_COLOR}`,
  },

  attachmentTitle: {
    margin:
      "0 0 5px",

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",

    fontWeight:
      700,
  },

  attachmentText: {
    margin:
      0,

    color:
      TEXT_SECONDARY,

    fontSize:
      "12px",

    lineHeight:
      "19px",

    wordBreak:
      "break-word" as const,
  },

  supportBox: {
    margin:
      "27px 0 0",

    padding:
      "19px",

    borderRadius:
      "12px",

    backgroundColor:
      PINK_BACKGROUND,
  },

  supportTitle: {
    margin:
      "0 0 7px",

    color:
      TEXT_PRIMARY,

    fontSize:
      "14px",

    lineHeight:
      "20px",

    fontWeight:
      800,
  },

  supportText: {
    margin:
      "0 0 5px",

    color:
      TEXT_SECONDARY,

    fontSize:
      "12px",

    lineHeight:
      "19px",
  },

  supportLink: {
    color:
      BRAND_MAGENTA_DARK,

    textDecoration:
      "none",

    fontWeight:
      700,
  },

  divider: {
    height:
      "1px",

    margin:
      "28px 0 0",

    backgroundColor:
      BORDER_COLOR,

    border:
      0,
  },

  footer: {
    padding:
      "22px 34px 30px",

    backgroundColor:
      SOFT_BACKGROUND,

    textAlign:
      "center" as const,
  },

  footerBrand: {
    margin:
      0,

    color:
      TEXT_PRIMARY,

    fontSize:
      "13px",

    lineHeight:
      "19px",

    fontWeight:
      700,
  },

  footerText: {
    margin:
      "5px 0 0",

    color:
      "#888888",

    fontSize:
      "11px",

    lineHeight:
      "18px",
  },
} satisfies Record<
  string,
  React.CSSProperties
>;


/* ==========================================================================
   8. SOUS-COMPOSANT INFO
   ========================================================================== */

interface InfoBlockProps {
  readonly label:
    string;

  readonly value:
    string;
}


function InfoBlock({
  label,
  value,
}: InfoBlockProps) {
  return (
    <>
      <p
        style={
          styles.infoLabel
        }
      >
        {label}
      </p>

      <p
        style={
          styles.infoValue
        }
      >
        {value}
      </p>
    </>
  );
}


/* ==========================================================================
   9. PRODUITS
   ========================================================================== */

interface OrderItemsProps {
  readonly items:
    readonly OrderConfirmationItem[];
}


function OrderItems({
  items,
}: OrderItemsProps) {
  if (
    items.length ===
    0
  ) {
    return (
      <div
        style={{
          padding:
            "16px",

          border:
            `1px solid ${BORDER_COLOR}`,

          borderRadius:
            "10px",

          color:
            TEXT_SECONDARY,

          fontSize:
            "13px",

          lineHeight:
            "20px",
        }}
      >
        Aucun article disponible.
      </div>
    );
  }


  return (
    <table
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={
        styles.productsTable
      }
    >
      <tbody>
        {items.map(
          (
            item,
            index,
          ) => {
            const sku =
              normalizeText(
                item.sku,
              );

            const meta =
              [
                sku
                  ? `Réf. ${sku}`
                  : null,

                `Qté : ${item.quantity}`,

                `${formatMoney(
                  item.unitPrice,
                )} / unité`,
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
                  " • ",
                );


            return (
              <tr
                key={
                  `${item.productName}-${item.sku ?? "sans-sku"}-${index}`
                }
              >
                <td
                  style={{
                    ...styles.productCell,

                    borderBottom:
                      index ===
                      items.length -
                        1
                        ? "0"
                        : styles
                            .productCell
                            .borderBottom,
                  }}
                >
                  <p
                    style={
                      styles.productName
                    }
                  >
                    {getDisplayText(
                      item.productName,
                    )}
                  </p>

                  <p
                    style={
                      styles.productMeta
                    }
                  >
                    {meta}
                  </p>
                </td>

                <td
                  width="130"
                  style={{
                    ...styles.productCell,

                    borderBottom:
                      index ===
                      items.length -
                        1
                        ? "0"
                        : styles
                            .productCell
                            .borderBottom,
                  }}
                >
                  <p
                    style={
                      styles.productTotal
                    }
                  >
                    {formatMoney(
                      item.total,
                    )}
                  </p>
                </td>
              </tr>
            );
          },
        )}
      </tbody>
    </table>
  );
}


/* ==========================================================================
   10. TOTAUX
   ========================================================================== */

interface OrderTotalsProps {
  readonly productsSubtotal:
    OrderConfirmationMoney;

  readonly deliveryAmount:
    OrderConfirmationMoney;

  readonly total:
    OrderConfirmationMoney;
}


function OrderTotals({
  productsSubtotal,
  deliveryAmount,
  total,
}: OrderTotalsProps) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={
        styles.totalTable
      }
    >
      <tbody>
        <tr>
          <td
            style={
              styles.totalLabelCell
            }
          >
            Sous-total produits
          </td>

          <td
            style={
              styles.totalValueCell
            }
          >
            {formatMoney(
              productsSubtotal,
            )}
          </td>
        </tr>

        <tr>
          <td
            style={
              styles.totalLabelCell
            }
          >
            Livraison
          </td>

          <td
            style={
              styles.totalValueCell
            }
          >
            {formatMoney(
              deliveryAmount,
            )}
          </td>
        </tr>

        <tr>
          <td
            style={
              styles.grandTotalLabelCell
            }
          >
            Total
          </td>

          <td
            style={
              styles.grandTotalValueCell
            }
          >
            {formatMoney(
              total,
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}


/* ==========================================================================
   11. PAIEMENT
   ========================================================================== */

interface PaymentSummaryProps {
  readonly payment:
    OrderConfirmationEmailProps["payment"];
}


function PaymentSummary({
  payment,
}: PaymentSummaryProps) {
  const paymentReference =
    normalizeText(
      payment.reference,
    );


  const badgeStyle: React.CSSProperties = {
    ...styles.paymentBadge,

    ...getPaymentStateStyle(
      payment.state,
    ),
  };


  return (
    <div
      style={
        styles.paymentBox
      }
    >
      <h2
        style={
          styles.sectionTitle
        }
      >
        Paiement
      </h2>

      <table
        role="presentation"
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={
          styles.paymentTable
        }
      >
        <tbody>
          <tr>
            <td
              style={
                styles.paymentLabel
              }
            >
              Mode de paiement
            </td>

            <td
              style={
                styles.paymentValue
              }
            >
              {getDisplayText(
                payment.label,
              )}
            </td>
          </tr>

          <tr>
            <td
              style={
                styles.paymentLabel
              }
            >
              État
            </td>

            <td
              style={
                styles.paymentValue
              }
            >
              <span
                style={
                  badgeStyle
                }
              >
                {getDisplayText(
                  payment.stateLabel,
                )}
              </span>
            </td>
          </tr>

          {paymentReference
            ? (
                <tr>
                  <td
                    style={
                      styles.paymentLabel
                    }
                  >
                    Référence
                  </td>

                  <td
                    style={
                      styles.paymentValue
                    }
                  >
                    {paymentReference}
                  </td>
                </tr>
              )
            : null}
        </tbody>
      </table>
    </div>
  );
}


/* ==========================================================================
   12. TEMPLATE
   ========================================================================== */

export default function OrderConfirmationEmail({
  orderNumber,
  orderDate,
  customer,
  delivery,
  items,
  productsSubtotal,
  deliveryAmount,
  total,
  payment,
  receiptFileName = null,
}: OrderConfirmationEmailProps) {
  const safeOrderNumber =
    getDisplayText(
      orderNumber,
    );

  const customerName =
    getCustomerFullName(
      customer,
    );

  const customerFirstName =
    normalizeText(
      customer.firstName,
    ) ||
    customerName;

  const receiptName =
    normalizeText(
      receiptFileName,
    );

  const preheader =
    `Confirmation de votre commande ${safeOrderNumber} chez ${PUBLIC_SITE.brand.name}.`;


  return (
    <html
      lang="fr"
      style={
        styles.html
      }
    >
      {/*
       * Le template e-mail n'utilise volontairement pas de balise <head>.
       *
       * Dans ce fichier React destiné à l'e-mail transactionnel, le contenu
       * utile et le preheader sont portés par le <body>. Cela évite également
       * que le lint Next.js traite ce template e-mail comme une page App Router
       * et déclenche @next/next/no-head-element.
       */}
      <body
        style={
          styles.body
        }
      >
        {/* PREHEADER */}
        <div
          style={
            styles.preheader
          }
        >
          {preheader}
        </div>


        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={
            styles.outerTable
          }
        >
          <tbody>
            <tr>
              <td
                align="center"
                style={
                  styles.containerCell
                }
              >
                <div
                  style={
                    styles.container
                  }
                >
                  {/* ========================================================
                      HEADER
                      ======================================================== */}

                  <div
                    style={
                      styles.header
                    }
                  >
                    <p
                      style={
                        styles.brand
                      }
                    >
                      L&amp;E{" "}
                      <span
                        style={
                          styles.brandAccent
                        }
                      >
                        Cosmetics
                      </span>{" "}
                      Empire
                    </p>

                    <p
                      style={
                        styles.headerSubtitle
                      }
                    >
                      Confirmation de commande
                    </p>
                  </div>


                  {/* ========================================================
                      CONTENU PRINCIPAL
                      ======================================================== */}

                  <main
                    style={
                      styles.content
                    }
                  >
                    <p
                      style={
                        styles.eyebrow
                      }
                    >
                      Commande enregistrée
                    </p>

                    <h1
                      style={
                        styles.heading
                      }
                    >
                      Merci {customerFirstName}
                    </h1>

                    <p
                      style={
                        styles.paragraph
                      }
                    >
                      Votre commande a bien été enregistrée chez{" "}
                      <strong>
                        {PUBLIC_SITE.brand.name}
                      </strong>
                      .
                    </p>

                    <p
                      style={
                        styles.paragraph
                      }
                    >
                      Vous trouverez ci-dessous le récapitulatif
                      des informations enregistrées pour cette
                      commande.
                    </p>


                    {/* ======================================================
                        RÉFÉRENCE COMMANDE
                        ====================================================== */}

                    <div
                      style={
                        styles.referenceBox
                      }
                    >
                      <p
                        style={
                          styles.referenceLabel
                        }
                      >
                        Référence de commande
                      </p>

                      <p
                        style={
                          styles.referenceValue
                        }
                      >
                        {safeOrderNumber}
                      </p>
                    </div>


                    {/* ======================================================
                        INFORMATIONS COMMANDE
                        ====================================================== */}

                    <section
                      style={
                        styles.section
                      }
                    >
                      <h2
                        style={
                          styles.sectionTitle
                        }
                      >
                        Informations de commande
                      </h2>

                      <table
                        role="presentation"
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={
                          styles.infoTable
                        }
                      >
                        <tbody>
                          <tr>
                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Commande"
                                value={
                                  safeOrderNumber
                                }
                              />
                            </td>

                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Date"
                                value={
                                  formatOrderDate(
                                    orderDate,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </section>


                    {/* ======================================================
                        CLIENTE
                        ====================================================== */}

                    <section
                      style={
                        styles.section
                      }
                    >
                      <h2
                        style={
                          styles.sectionTitle
                        }
                      >
                        Informations cliente
                      </h2>

                      <table
                        role="presentation"
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={
                          styles.infoTable
                        }
                      >
                        <tbody>
                          <tr>
                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Nom"
                                value={
                                  customerName
                                }
                              />

                              <div
                                style={{
                                  height:
                                    "12px",
                                }}
                              />

                              <InfoBlock
                                label="E-mail"
                                value={
                                  getDisplayText(
                                    customer.email,
                                  )
                                }
                              />
                            </td>

                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Téléphone"
                                value={
                                  getDisplayText(
                                    customer.phone,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </section>


                    {/* ======================================================
                        LIVRAISON
                        ====================================================== */}

                    <section
                      style={
                        styles.section
                      }
                    >
                      <h2
                        style={
                          styles.sectionTitle
                        }
                      >
                        Livraison
                      </h2>

                      <table
                        role="presentation"
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={
                          styles.infoTable
                        }
                      >
                        <tbody>
                          <tr>
                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Destinataire"
                                value={
                                  getDeliveryRecipientName({
                                    orderNumber,
                                    orderDate,
                                    customer,
                                    delivery,
                                    items,
                                    productsSubtotal,
                                    deliveryAmount,
                                    total,
                                    payment,
                                    receiptFileName,
                                  })
                                }
                              />

                              <div
                                style={{
                                  height:
                                    "12px",
                                }}
                              />

                              <InfoBlock
                                label="Téléphone"
                                value={
                                  getDisplayText(
                                    delivery.phone ??
                                      customer.phone,
                                  )
                                }
                              />
                            </td>

                            <td
                              style={
                                styles.infoCell
                              }
                            >
                              <InfoBlock
                                label="Ville / Pays"
                                value={
                                  getCountryCityLabel(
                                    delivery,
                                  )
                                }
                              />

                              <div
                                style={{
                                  height:
                                    "12px",
                                }}
                              />

                              <InfoBlock
                                label="Adresse"
                                value={
                                  getDisplayText(
                                    delivery.address,
                                  )
                                }
                              />

                              {normalizeText(
                                delivery.postalCode,
                              )
                                ? (
                                    <>
                                      <div
                                        style={{
                                          height:
                                            "12px",
                                        }}
                                      />

                                      <InfoBlock
                                        label="Code postal"
                                        value={
                                          getDisplayText(
                                            delivery.postalCode,
                                          )
                                        }
                                      />
                                    </>
                                  )
                                : null}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </section>


                    {/* ======================================================
                        PRODUITS
                        ====================================================== */}

                    <section
                      style={
                        styles.section
                      }
                    >
                      <h2
                        style={
                          styles.sectionTitle
                        }
                      >
                        Produits commandés
                      </h2>

                      <OrderItems
                        items={
                          items
                        }
                      />

                      <OrderTotals
                        productsSubtotal={
                          productsSubtotal
                        }
                        deliveryAmount={
                          deliveryAmount
                        }
                        total={
                          total
                        }
                      />
                    </section>


                    {/* ======================================================
                        PAIEMENT
                        ====================================================== */}

                    <PaymentSummary
                      payment={
                        payment
                      }
                    />


                    {/* ======================================================
                        REÇU PDF
                        ====================================================== */}

                    {receiptName
                      ? (
                          <div
                            style={
                              styles.attachmentBox
                            }
                          >
                            <p
                              style={
                                styles.attachmentTitle
                              }
                            >
                              Votre reçu PDF est joint à cet e-mail
                            </p>

                            <p
                              style={
                                styles.attachmentText
                              }
                            >
                              Fichier : {receiptName}
                            </p>
                          </div>
                        )
                      : null}


                    {/* ======================================================
                        SUPPORT
                        ====================================================== */}

                    <div
                      style={
                        styles.supportBox
                      }
                    >
                      <p
                        style={
                          styles.supportTitle
                        }
                      >
                        Besoin d’aide ?
                      </p>

                      <p
                        style={
                          styles.supportText
                        }
                      >
                        E-mail :{" "}
                        <a
                          href={
                            PUBLIC_SITE
                              .contact
                              .email
                              .href
                          }
                          style={
                            styles.supportLink
                          }
                        >
                          {
                            PUBLIC_SITE
                              .contact
                              .email
                              .address
                          }
                        </a>
                      </p>

                      <p
                        style={
                          styles.supportText
                        }
                      >
                        Téléphone :{" "}
                        <a
                          href={
                            PUBLIC_SITE
                              .contact
                              .phone
                              .href
                          }
                          style={
                            styles.supportLink
                          }
                        >
                          {
                            PUBLIC_SITE
                              .contact
                              .phone
                              .display
                          }
                        </a>
                      </p>

                      <p
                        style={
                          styles.supportText
                        }
                      >
                        WhatsApp :{" "}
                        <a
                          href={
                            PUBLIC_SITE
                              .contact
                              .whatsapp
                              .href
                          }
                          style={
                            styles.supportLink
                          }
                        >
                          {
                            PUBLIC_SITE
                              .contact
                              .whatsapp
                              .display
                          }
                        </a>
                      </p>
                    </div>

                    <hr
                      style={
                        styles.divider
                      }
                    />
                  </main>


                  {/* ========================================================
                      FOOTER EMAIL
                      ======================================================== */}

                  <footer
                    style={
                      styles.footer
                    }
                  >
                    <p
                      style={
                        styles.footerBrand
                      }
                    >
                      {PUBLIC_SITE.brand.name}
                    </p>

                    <p
                      style={
                        styles.footerText
                      }
                    >
                      Référence : {safeOrderNumber}
                    </p>

                    <p
                      style={
                        styles.footerText
                      }
                    >
                      Cet e-mail concerne une commande enregistrée
                      sur notre boutique.
                    </p>
                  </footer>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}


/* ==========================================================================
   13. VERSION TEXTE
   ========================================================================== */

/**
 * Fournit également une version texte propre.
 *
 * public-order-email.ts pourra l'envoyer à Resend en complément
 * de la version HTML / React.
 */
export function buildOrderConfirmationText(
  props:
    OrderConfirmationEmailProps,
): string {
  const customerName =
    getCustomerFullName(
      props.customer,
    );

  const deliveryName =
    getDeliveryRecipientName(
      props,
    );

  const location =
    getCountryCityLabel(
      props.delivery,
    );

  const lines:
    string[] = [
      PUBLIC_SITE.brand.name,
      "",
      "CONFIRMATION DE COMMANDE",
      "",
      `Bonjour ${customerName},`,
      "",
      "Votre commande a bien été enregistrée.",
      "",
      `Référence : ${getDisplayText(
        props.orderNumber,
      )}`,
      `Date : ${formatOrderDate(
        props.orderDate,
      )}`,
      "",
      "CLIENTE",
      `Nom : ${customerName}`,
      `E-mail : ${getDisplayText(
        props.customer.email,
      )}`,
      `Téléphone : ${getDisplayText(
        props.customer.phone,
      )}`,
      "",
      "LIVRAISON",
      `Destinataire : ${deliveryName}`,
      `Téléphone : ${getDisplayText(
        props.delivery.phone ??
          props.customer.phone,
      )}`,
      `Ville / Pays : ${location}`,
      `Adresse : ${getDisplayText(
        props.delivery.address,
      )}`,
    ];


  const postalCode =
    normalizeText(
      props.delivery.postalCode,
    );

  if (postalCode) {
    lines.push(
      `Code postal : ${postalCode}`,
    );
  }


  lines.push(
    "",
    "PRODUITS",
  );


  if (
    props.items.length ===
    0
  ) {
    lines.push(
      "Aucun article disponible.",
    );
  } else {
    for (
      const item of
      props.items
    ) {
      const metadata =
        [
          normalizeText(
            item.sku,
          )
            ? `Réf. ${normalizeText(
                item.sku,
              )}`
            : null,

          `Qté ${item.quantity}`,

          `${formatMoney(
            item.unitPrice,
          )} / unité`,
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
            " | ",
          );


      lines.push(
        `- ${getDisplayText(
          item.productName,
        )}`,
        `  ${metadata}`,
        `  Total : ${formatMoney(
          item.total,
        )}`,
      );
    }
  }


  lines.push(
    "",
    `Sous-total produits : ${formatMoney(
      props.productsSubtotal,
    )}`,

    `Livraison : ${formatMoney(
      props.deliveryAmount,
    )}`,

    `TOTAL : ${formatMoney(
      props.total,
    )}`,

    "",
    "PAIEMENT",

    `Mode : ${getDisplayText(
      props.payment.label,
    )}`,

    `État : ${getDisplayText(
      props.payment.stateLabel,
    )}`,
  );


  const paymentReference =
    normalizeText(
      props.payment.reference,
    );

  if (
    paymentReference
  ) {
    lines.push(
      `Référence paiement : ${paymentReference}`,
    );
  }


  const receiptFileName =
    normalizeText(
      props.receiptFileName,
    );

  if (
    receiptFileName
  ) {
    lines.push(
      "",
      "REÇU PDF",
      `Votre reçu est joint à cet e-mail : ${receiptFileName}`,
    );
  }


  lines.push(
    "",
    "BESOIN D'AIDE ?",

    `E-mail : ${
      PUBLIC_SITE
        .contact
        .email
        .address
    }`,

    `Téléphone : ${
      PUBLIC_SITE
        .contact
        .phone
        .display
    }`,

    `WhatsApp : ${
      PUBLIC_SITE
        .contact
        .whatsapp
        .display
    }`,

    "",
    PUBLIC_SITE.brand.name,
  );


  return lines.join(
    "\n",
  );
}