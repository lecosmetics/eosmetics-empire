import "server-only";

import * as React from "react";

import {

  Document,

  Image,

  Page,

  StyleSheet,

  Text,

  View,

  renderToBuffer,

} from "@react-pdf/renderer";

import type { Prisma } from "@prisma/client";

import { PUBLIC_SITE } from "@/config/public-site";

import { db } from "@/prisma/db";

/**

 * ============================================================================

 * L&E COSMETICS EMPIRE

 * COMMANDE PUBLIQUE — REÇU PDF

 * ============================================================================

 *

 * Fichier :

 *

 * src/lib/public/commande/public-order-receipt.ts

 *

 * ============================================================================

 *

 * RESPONSABILITÉS :

 *

 * - relire une vraie commande depuis PostgreSQL ;

 * - relire le vrai Receipt associé ;

 * - relire les vraies lignes produit ;

 * - récupérer l'image principale du produit lorsque disponible ;

 * - déterminer le véritable état de paiement ;

 * - générer un PDF professionnel ;

 * - stocker le PDF dans Supabase Storage privé ;

 * - utiliser prioritairement la nouvelle SUPABASE_SECRET_KEY ;

 * - conserver un fallback legacy SUPABASE_SERVICE_ROLE_KEY ;

 * - mettre à jour Receipt.pdfUrl ;

 * - retourner les bytes pour l'e-mail.

 *

 * ============================================================================

 *

 * IMPORTANT :

 *

 * Le PDF n'est jamais construit depuis :

 *

 * - localStorage ;

 * - sessionStorage ;

 * - un total envoyé par le navigateur ;

 * - un statut de paiement envoyé par le navigateur.

 *

 * Toutes les données importantes viennent de PostgreSQL.

 *

 * ============================================================================

 */

/* ==========================================================================

   1. CONSTANTES

   ========================================================================== */

const PUBLIC_ORDER_RECEIPT_MIME_TYPE =

  "application/pdf" as const;

const PUBLIC_ORDER_RECEIPT_MAX_BYTES =

  12 * 1024 * 1024;

const PUBLIC_ORDER_RECEIPT_MAX_IMAGE_BYTES =

  4 * 1024 * 1024;

const PUBLIC_ORDER_RECEIPT_IMAGE_TIMEOUT_MS =

  8_000;

const PUBLIC_ORDER_RECEIPT_STORAGE_TIMEOUT_MS =

  20_000;

const PUBLIC_ORDER_RECEIPT_STORAGE_ENV =

  "SUPABASE_ORDER_RECEIPTS_BUCKET" as const;

const PUBLIC_ORDER_RECEIPT_SECRET_ENV =

  "SUPABASE_SECRET_KEY" as const;

const PUBLIC_ORDER_RECEIPT_LEGACY_SERVICE_ROLE_ENV =

  "SUPABASE_SERVICE_ROLE_KEY" as const;

const PUBLIC_ORDER_RECEIPT_MAX_FILE_SEGMENT_LENGTH =

  120;

/* ==========================================================================

   2. TYPES

   ========================================================================== */

export type PublicOrderReceiptPaymentState =

  | "TO_PAY"

  | "PENDING"

  | "PAID";

export interface PublicOrderReceiptMoney {

  readonly amount: string;

  readonly currency: string;

}

export interface PublicOrderReceiptItem {

  readonly storeProductId: string | null;

  readonly productName: string;

  readonly sku: string | null;

  readonly quantity: number;

  readonly unitPrice: PublicOrderReceiptMoney;

  readonly total: PublicOrderReceiptMoney;

  readonly imageUrl: string | null;

}

export interface PublicOrderReceiptData {

  readonly receiptId: string;

  readonly receiptNumber: string;

  readonly orderId: string;

  readonly orderNumber: string;

  readonly orderDate: Date;

  readonly issuedAt: Date;

  readonly customer: {

    readonly firstName: string;

    readonly lastName: string;

    readonly email: string | null;

    readonly phone: string | null;

  };

  readonly delivery: {

    readonly recipientName: string | null;

    readonly phone: string | null;

    readonly country: string | null;

    readonly city: string | null;

    readonly address: string | null;

    readonly postalCode: string | null;

  };

  readonly items: readonly PublicOrderReceiptItem[];

  readonly productsSubtotal: PublicOrderReceiptMoney;

  readonly deliveryAmount: PublicOrderReceiptMoney;

  readonly total: PublicOrderReceiptMoney;

  readonly payment: {

    readonly label: string;

    readonly state: PublicOrderReceiptPaymentState;

    readonly stateLabel: string;

    readonly reference: string | null;

  };

}

export interface RenderedPublicOrderReceipt {

  readonly bytes: Uint8Array;

  readonly mimeType:

    typeof PUBLIC_ORDER_RECEIPT_MIME_TYPE;

  readonly fileName: string;

  readonly size: number;

  readonly data: PublicOrderReceiptData;

}

export interface StoredPublicOrderReceipt

  extends RenderedPublicOrderReceipt {

  readonly storagePath: string;

  readonly pdfUrl: string;

}

export type GeneratePublicOrderReceiptResult =

  | Readonly<{

      success: true;

      data: StoredPublicOrderReceipt;

    }>

  | Readonly<{

      success: false;

      code: PublicOrderReceiptErrorCode;

      message: string;

    }>;

export type PublicOrderReceiptErrorCode =

  | "INVALID_ORDER_ID"

  | "ORDER_NOT_FOUND"

  | "RECEIPT_NOT_FOUND"

  | "INVALID_RECEIPT_DATA"

  | "PDF_RENDER_FAILED"

  | "PDF_EMPTY"

  | "PDF_TOO_LARGE"

  | "STORAGE_NOT_CONFIGURED"

  | "STORAGE_UPLOAD_FAILED"

  | "DATABASE_UPDATE_FAILED"

  | "SERVER_ERROR";

/* ==========================================================================

   3. ERREUR INTERNE

   ========================================================================== */

class PublicOrderReceiptError extends Error {

  readonly code: PublicOrderReceiptErrorCode;

  constructor(

    code: PublicOrderReceiptErrorCode,

    message: string,

  ) {

    super(message);

    this.name =

      "PublicOrderReceiptError";

    this.code =

      code;

  }

}

/* ==========================================================================

   4. SELECT DATABASE

   ========================================================================== */

const PUBLIC_ORDER_RECEIPT_ORDER_SELECT = {

  id: true,

  orderNumber: true,

  customerFirstName: true,

  customerLastName: true,

  customerEmail: true,

  customerPhone: true,

  shippingRecipientName: true,

  shippingPhone: true,

  shippingCountry: true,

  shippingCity: true,

  shippingAddress: true,

  shippingPostalCode: true,

  currency: true,

  subtotal: true,

  shippingAmount: true,

  totalAmount: true,

  createdAt: true,

  items: {

    orderBy: {

      createdAt: "asc",

    },

    select: {

      storeProductId: true,

      productName: true,

      sku: true,

      quantity: true,

      unitPrice: true,

      totalPrice: true,

      storeProduct: {

        select: {

          product: {

            select: {

              images: {

                orderBy: [

                  {

                    isPrimary:

                      "desc",

                  },

                  {

                    position:

                      "asc",

                  },

                  {

                    createdAt:

                      "asc",

                  },

                ],

                take: 1,

                select: {

                  url: true,

                },

              },

            },

          },

        },

      },

    },

  },

  payments: {

    orderBy: {

      createdAt:

        "desc",

    },

    select: {

      paymentReference: true,

      method: true,

      status: true,

      provider: true,

      providerReference: true,

    },

  },

  receipt: {

    select: {

      id: true,

      receiptNumber: true,

      issuedAt: true,

      pdfUrl: true,

    },

  },

} satisfies Prisma.OrderSelect;

/* ==========================================================================

   5. NORMALISATION

   ========================================================================== */

function normalizeOrderId(

  orderId: string,

): string {

  return orderId.trim();

}

function normalizeCurrency(

  currency: string,

): string {

  return currency

    .trim()

    .toUpperCase();

}

function normalizeNullableText(

  value: string | null | undefined,

): string | null {

  if (

    value === null ||

    value === undefined

  ) {

    return null;

  }

  const normalized =

    value.trim();

  return normalized ||

    null;

}

function normalizeRequiredText(

  value: string,

  fieldName: string,

): string {

  const normalized =

    value.trim();

  if (!normalized) {

    throw new PublicOrderReceiptError(

      "INVALID_RECEIPT_DATA",

      `La donnée obligatoire "${fieldName}" est invalide.`,

    );

  }

  return normalized;

}

/* ==========================================================================

   6. NOM DE FICHIER

   ========================================================================== */

function sanitizeFileSegment(

  value: string,

  fallback: string,

): string {

  const normalized =

    value

      .trim()

      .replace(

        /[^A-Za-z0-9._-]/gu,

        "-",

      )

      .replace(

        /-+/gu,

        "-",

      )

      .replace(

        /^[-.]+|[-.]+$/gu,

        "",

      )

      .slice(

        0,

        PUBLIC_ORDER_RECEIPT_MAX_FILE_SEGMENT_LENGTH,

      );

  return normalized ||

    fallback;

}

export function getPublicOrderReceiptFileName(

  orderNumber: string,

): string {

  const safeOrderNumber =

    sanitizeFileSegment(

      orderNumber,

      "commande",

    );

  return `L-E-Cosmetics-Recu-${safeOrderNumber}.pdf`;

}

/* ==========================================================================

   7. LABEL MÉTHODE

   ========================================================================== */

function getPaymentMethodLabel(

  method: string,

): string {

  switch (method) {

    case "MOBILE_MONEY":

      return "Mobile Money";

    case "CARD":

      return "Carte bancaire";

    case "BANK_TRANSFER":

      return "Virement bancaire";

    case "CASH":

      return "Espèces";

    case "OTHER":

      return "Paiement en ligne";

    default:

      return "Paiement";

  }

}

/* ==========================================================================

   8. INFORMATIONS PAIEMENT

   ========================================================================== */

function resolveReceiptPayment(

  payments: readonly Readonly<{

    paymentReference: string;

    method: string;

    status: string;

    provider: string | null;

    providerReference: string | null;

  }>[],

): PublicOrderReceiptData["payment"] {

  /**

   * Aucun Payment :

   *

   * dans le flux public actuel, cela correspond au paiement

   * restant à effectuer, notamment lorsqu'il est prévu

   * à la livraison.

   */

  if (

    payments.length === 0

  ) {

    return {

      label:

        "Paiement à la livraison",

      state:

        "TO_PAY",

      stateLabel:

        "À payer",

      reference:

        null,

    };

  }

  /**

   * Priorité absolue à un paiement réellement confirmé.

   */

  const paidPayment =

    payments.find(

      (payment) =>

        payment.status ===

        "PAID",

    );

  if (paidPayment) {

    return {

      label:

        getPaymentMethodLabel(

          paidPayment.method,

        ),

      state:

        "PAID",

      stateLabel:

        "Payé",

      reference:

        normalizeNullableText(

          paidPayment.providerReference,

        ) ??

        normalizeNullableText(

          paidPayment.paymentReference,

        ),

    };

  }

  /**

   * Ensuite on cherche une transaction réellement en attente.

   */

  const pendingPayment =

    payments.find(

      (payment) =>

        payment.status ===

        "PENDING",

    );

  if (pendingPayment) {

    return {

      label:

        getPaymentMethodLabel(

          pendingPayment.method,

        ),

      state:

        "PENDING",

      stateLabel:

        "En attente",

      reference:

        normalizeNullableText(

          pendingPayment.providerReference,

        ) ??

        normalizeNullableText(

          pendingPayment.paymentReference,

        ),

    };

  }

  /**

   * Si aucun paiement n'est payé ou en attente,

   * le montant n'est pas considéré comme encaissé.

   */

  const latestPayment =

    payments[0];

  if (!latestPayment) {

    return {

      label:

        "Paiement à la livraison",

      state:

        "TO_PAY",

      stateLabel:

        "À payer",

      reference:

        null,

    };

  }

  return {

    label:

      getPaymentMethodLabel(

        latestPayment.method,

      ),

    state:

      "TO_PAY",

    stateLabel:

      "À payer",

    reference:

      normalizeNullableText(

        latestPayment.providerReference,

      ) ??

      normalizeNullableText(

        latestPayment.paymentReference,

      ),

  };

}

/* ==========================================================================

   9. CHARGEMENT DONNÉES

   ========================================================================== */

export async function loadPublicOrderReceiptData(

  rawOrderId: string,

): Promise<PublicOrderReceiptData> {

  const orderId =

    normalizeOrderId(

      rawOrderId,

    );

  if (!orderId) {

    throw new PublicOrderReceiptError(

      "INVALID_ORDER_ID",

      "L’identifiant de commande est invalide.",

    );

  }

  const order =

    await db.order.findUnique({

      where: {

        id:

          orderId,

      },

      select:

        PUBLIC_ORDER_RECEIPT_ORDER_SELECT,

    });

  if (!order) {

    throw new PublicOrderReceiptError(

      "ORDER_NOT_FOUND",

      "La commande est introuvable.",

    );

  }

  if (!order.receipt) {

    throw new PublicOrderReceiptError(

      "RECEIPT_NOT_FOUND",

      "Le reçu de cette commande est introuvable.",

    );

  }

  const currency =

    normalizeCurrency(

      order.currency,

    );

  if (!currency) {

    throw new PublicOrderReceiptError(

      "INVALID_RECEIPT_DATA",

      "La devise de la commande est invalide.",

    );

  }

  const orderNumber =

    normalizeRequiredText(

      order.orderNumber,

      "orderNumber",

    );

  const receiptNumber =

    normalizeRequiredText(

      order.receipt.receiptNumber,

      "receiptNumber",

    );

  const customerFirstName =

    normalizeRequiredText(

      order.customerFirstName,

      "customerFirstName",

    );

  const customerLastName =

    normalizeRequiredText(

      order.customerLastName,

      "customerLastName",

    );

  const items:

    PublicOrderReceiptItem[] =

    order.items.map(

      (item) => {

        const productName =

          normalizeRequiredText(

            item.productName,

            "productName",

          );

        if (

          !Number.isInteger(

            item.quantity,

          ) ||

          item.quantity <= 0

        ) {

          throw new PublicOrderReceiptError(

            "INVALID_RECEIPT_DATA",

            `La quantité du produit "${productName}" est invalide.`,

          );

        }

        return {

          storeProductId:

            item.storeProductId,

          productName,

          sku:

            normalizeNullableText(

              item.sku,

            ),

          quantity:

            item.quantity,

          unitPrice: {

            amount:

              item.unitPrice.toFixed(

                2,

              ),

            currency,

          },

          total: {

            amount:

              item.totalPrice.toFixed(

                2,

              ),

            currency,

          },

          imageUrl:

            normalizeNullableText(

              item.storeProduct

                ?.product

                .images[0]

                ?.url,

            ),

        };

      },

    );

  if (

    items.length === 0

  ) {

    throw new PublicOrderReceiptError(

      "INVALID_RECEIPT_DATA",

      "La commande ne contient aucun article.",

    );

  }

  return {

    receiptId:

      order.receipt.id,

    receiptNumber,

    orderId:

      order.id,

    orderNumber,

    orderDate:

      order.createdAt,

    issuedAt:

      order.receipt.issuedAt,

    customer: {

      firstName:

        customerFirstName,

      lastName:

        customerLastName,

      email:

        normalizeNullableText(

          order.customerEmail,

        ),

      phone:

        normalizeNullableText(

          order.customerPhone,

        ),

    },

    delivery: {

      recipientName:

        normalizeNullableText(

          order.shippingRecipientName,

        ),

      phone:

        normalizeNullableText(

          order.shippingPhone,

        ),

      country:

        normalizeNullableText(

          order.shippingCountry,

        ),

      city:

        normalizeNullableText(

          order.shippingCity,

        ),

      address:

        normalizeNullableText(

          order.shippingAddress,

        ),

      postalCode:

        normalizeNullableText(

          order.shippingPostalCode,

        ),

    },

    items,

    productsSubtotal: {

      amount:

        order.subtotal.toFixed(

          2,

        ),

      currency,

    },

    deliveryAmount: {

      amount:

        order.shippingAmount.toFixed(

          2,

        ),

      currency,

    },

    total: {

      amount:

        order.totalAmount.toFixed(

          2,

        ),

      currency,

    },

    payment:

      resolveReceiptPayment(

        order.payments,

      ),

  };

}

/* ==========================================================================

   10. FORMATAGE MONÉTAIRE

   ========================================================================== */

function formatReceiptMoney(

  money: PublicOrderReceiptMoney,

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

  ).format(amount)} ${money.currency}`;

}

/* ==========================================================================

   11. FORMATAGE DATE

   ========================================================================== */

function formatReceiptDate(

  value: Date,

): string {

  return new Intl.DateTimeFormat(

    "fr-FR",

    {

      dateStyle:

        "medium",

      timeStyle:

        "short",

    },

  ).format(value);

}

/* ==========================================================================

   12. CHARGEMENT IMAGE BEST EFFORT

   ========================================================================== */

/**

 * Une image défaillante ne doit jamais empêcher

 * l'émission du reçu.

 *

 * Le téléchargement possède également un timeout afin

 * qu'une URL distante lente ne bloque pas toute la génération.

 */

async function loadReceiptImageAsDataUrl(

  imageUrl: string | null,

): Promise<string | null> {

  if (!imageUrl) {

    return null;

  }

  let url: URL;

  try {

    url =

      new URL(

        imageUrl,

      );

  } catch {

    return null;

  }

  const isHttps =

    url.protocol ===

    "https:";

  const isDevelopmentHttp =

    url.protocol ===

      "http:" &&

    process.env.NODE_ENV !==

      "production";

  if (

    !isHttps &&

    !isDevelopmentHttp

  ) {

    return null;

  }

  const controller =

    new AbortController();

  const timeout =

    setTimeout(

      () => {

        controller.abort();

      },

      PUBLIC_ORDER_RECEIPT_IMAGE_TIMEOUT_MS,

    );

  try {

    const response =

      await fetch(

        url,

        {

          method:

            "GET",

          cache:

            "no-store",

          signal:

            controller.signal,

          redirect:

            "follow",

        },

      );

    if (!response.ok) {

      return null;

    }

    const rawContentLength =

      response.headers.get(

        "content-length",

      );

    if (rawContentLength) {

      const contentLength =

        Number(

          rawContentLength,

        );

      if (

        Number.isFinite(

          contentLength,

        ) &&

        contentLength >

          PUBLIC_ORDER_RECEIPT_MAX_IMAGE_BYTES

      ) {

        return null;

      }

    }

    const rawContentType =

      response.headers

        .get(

          "content-type",

        )

        ?.split(";")[0]

        ?.trim()

        .toLowerCase() ??

      "";

    const contentType =

      rawContentType ===

      "image/jpg"

        ? "image/jpeg"

        : rawContentType;

    if (

      contentType !==

        "image/jpeg" &&

      contentType !==

        "image/png"

    ) {

      return null;

    }

    const arrayBuffer =

      await response.arrayBuffer();

    if (

      arrayBuffer.byteLength ===

        0 ||

      arrayBuffer.byteLength >

        PUBLIC_ORDER_RECEIPT_MAX_IMAGE_BYTES

    ) {

      return null;

    }

    return `data:${contentType};base64,${Buffer.from(

      arrayBuffer,

    ).toString("base64")}`;

  } catch {

    return null;

  } finally {

    clearTimeout(

      timeout,

    );

  }

}

/* ==========================================================================

   13. IMAGES PDF

   ========================================================================== */

async function prepareReceiptImages(

  data: PublicOrderReceiptData,

): Promise<readonly (string | null)[]> {

  /**

   * Empêche de télécharger plusieurs fois exactement

   * la même image lorsqu'elle est utilisée par plusieurs lignes.

   */

  const imageCache =

    new Map<

      string,

      Promise<string | null>

    >();

  return Promise.all(

    data.items.map(

      (item) => {

        if (!item.imageUrl) {

          return Promise.resolve(

            null,

          );

        }

        const existing =

          imageCache.get(

            item.imageUrl,

          );

        if (existing) {

          return existing;

        }

        const loading =

          loadReceiptImageAsDataUrl(

            item.imageUrl,

          );

        imageCache.set(

          item.imageUrl,

          loading,

        );

        return loading;

      },

    ),

  );

}

/* ==========================================================================

   14. STYLES PDF

   ========================================================================== */

const pdfStyles =

  StyleSheet.create({

    page: {

      paddingTop:

        34,

      paddingRight:

        36,

      paddingBottom:

        40,

      paddingLeft:

        36,

      backgroundColor:

        "#FFFFFF",

      color:

        "#171717",

      fontFamily:

        "Helvetica",

      fontSize:

        9,

    },

    header: {

      flexDirection:

        "row",

      justifyContent:

        "space-between",

      alignItems:

        "flex-start",

      paddingBottom:

        16,

      marginBottom:

        18,

      borderBottomWidth:

        1,

      borderBottomColor:

        "#E5E7EB",

    },

    brand: {

      fontFamily:

        "Helvetica-Bold",

      fontSize:

        20,

      color:

        "#D61F69",

    },

    subtitle: {

      marginTop:

        4,

      fontSize:

        8,

      color:

        "#71717A",

    },

    receiptMeta: {

      alignItems:

        "flex-end",

    },

    metaStrong: {

      fontFamily:

        "Helvetica-Bold",

      fontSize:

        10,

    },

    section: {

      marginBottom:

        16,

    },

    sectionTitle: {

      marginBottom:

        8,

      fontFamily:

        "Helvetica-Bold",

      fontSize:

        11,

      color:

        "#18181B",

    },

    infoGrid: {

      flexDirection:

        "row",

    },

    infoColumnLeft: {

      width:

        "50%",

      paddingRight:

        9,

    },

    infoColumnRight: {

      width:

        "50%",

      paddingLeft:

        9,

    },

    label: {

      color:

        "#71717A",

      fontSize:

        7.5,

      marginBottom:

        2,

    },

    value: {

      marginBottom:

        6,

      fontSize:

        9,

    },

    item: {

      flexDirection:

        "row",

      alignItems:

        "center",

      paddingTop:

        8,

      paddingBottom:

        8,

      borderBottomWidth:

        1,

      borderBottomColor:

        "#EEEEEE",

    },

    productImage: {

      width:

        42,

      height:

        42,

      objectFit:

        "contain",

      marginRight:

        10,

      backgroundColor:

        "#F7F7F7",

    },

    imageFallback: {

      width:

        42,

      height:

        42,

      marginRight:

        10,

      backgroundColor:

        "#F4F4F5",

      alignItems:

        "center",

      justifyContent:

        "center",

    },

    imageFallbackText: {

      fontSize:

        6,

      color:

        "#A1A1AA",

    },

    productInfo: {

      flexGrow:

        1,

      flexShrink:

        1,

      paddingRight:

        10,

    },

    productName: {

      fontFamily:

        "Helvetica-Bold",

      fontSize:

        9,

    },

    productMeta: {

      marginTop:

        3,

      color:

        "#71717A",

      fontSize:

        7.5,

    },

    itemPrice: {

      width:

        92,

      textAlign:

        "right",

    },

    totals: {

      width:

        250,

      alignSelf:

        "flex-end",

      marginTop:

        14,

    },

    totalRow: {

      flexDirection:

        "row",

      justifyContent:

        "space-between",

      paddingTop:

        4,

      paddingBottom:

        4,

    },

    totalLabel: {

      color:

        "#52525B",

    },

    grandTotal: {

      flexDirection:

        "row",

      justifyContent:

        "space-between",

      marginTop:

        5,

      paddingTop:

        9,

      borderTopWidth:

        1,

      borderTopColor:

        "#D4D4D8",

      fontFamily:

        "Helvetica-Bold",

      fontSize:

        12,

    },

    paymentBox: {

      padding:

        12,

      marginTop:

        14,

      backgroundColor:

        "#FFF3F8",

      borderWidth:

        1,

      borderColor:

        "#F4C1D5",

    },

    paymentRow: {

      flexDirection:

        "row",

      justifyContent:

        "space-between",

      marginBottom:

        4,

    },

    paymentLabel: {

      color:

        "#71717A",

    },

    paymentValue: {

      maxWidth:

        300,

      textAlign:

        "right",

    },

    paymentState: {

      fontFamily:

        "Helvetica-Bold",

      color:

        "#D61F69",

    },

    footer: {

      marginTop:

        24,

      paddingTop:

        12,

      borderTopWidth:

        1,

      borderTopColor:

        "#E5E7EB",

      color:

        "#71717A",

      fontSize:

        7.5,

      textAlign:

        "center",

    },

  });

/* ==========================================================================

   15. DOCUMENT PDF

   ========================================================================== */

function createPublicOrderReceiptDocument(

  data: PublicOrderReceiptData,

  images: readonly (string | null)[],

) {

  const itemNodes =

    data.items.map(

      (

        item,

        index,

      ) => {

        const image =

          images[index] ??

          null;

        const imageNode =

          image

            ? React.createElement(

                Image,

                {

                  key:

                    "image",

                  src:

                    image,

                  style:

                    pdfStyles.productImage,

                },

              )

            : React.createElement(

                View,

                {

                  key:

                    "fallback",

                  style:

                    pdfStyles.imageFallback,

                },

                React.createElement(

                  Text,

                  {

                    style:

                      pdfStyles.imageFallbackText,

                  },

                  "Image",

                ),

              );

        return React.createElement(

          View,

          {

            key:

              `${item.storeProductId ?? "item"}-${index}`,

            style:

              pdfStyles.item,

            wrap:

              false,

          },

          imageNode,

          React.createElement(

            View,

            {

              style:

                pdfStyles.productInfo,

            },

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.productName,

              },

              item.productName,

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.productMeta,

              },

              [

                item.sku

                  ? `Réf. ${item.sku}`

                  : null,

                `Qté : ${item.quantity}`,

                `${formatReceiptMoney(

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

                ),

            ),

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.itemPrice,

            },

            formatReceiptMoney(

              item.total,

            ),

          ),

        );

      },

    );

  return React.createElement(

    Document,

    {

      title:

        `Reçu ${data.receiptNumber}`,

      author:

        PUBLIC_SITE.brand.name,

      subject:

        `Commande ${data.orderNumber}`,

      creator:

        PUBLIC_SITE.brand.name,

      producer:

        PUBLIC_SITE.brand.name,

    },

    React.createElement(

      Page,

      {

        size:

          "A4",

        style:

          pdfStyles.page,

        wrap:

          true,

      },

      /**

       * HEADER

       */

      React.createElement(

        View,

        {

          style:

            pdfStyles.header,

        },

        React.createElement(

          View,

          null,

          React.createElement(

            Text,

            {

              style:

                pdfStyles.brand,

            },

            PUBLIC_SITE.brand.name,

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.subtitle,

            },

            "Reçu de commande",

          ),

        ),

        React.createElement(

          View,

          {

            style:

              pdfStyles.receiptMeta,

          },

          React.createElement(

            Text,

            {

              style:

                pdfStyles.metaStrong,

            },

            data.receiptNumber,

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.subtitle,

            },

            `Commande : ${data.orderNumber}`,

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.subtitle,

            },

            `Commandée le : ${formatReceiptDate(

              data.orderDate,

            )}`,

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.subtitle,

            },

            `Reçu émis le : ${formatReceiptDate(

              data.issuedAt,

            )}`,

          ),

        ),

      ),

      /**

       * CLIENT + LIVRAISON

       */

      React.createElement(

        View,

        {

          style:

            pdfStyles.section,

        },

        React.createElement(

          Text,

          {

            style:

              pdfStyles.sectionTitle,

          },

          "Informations cliente et livraison",

        ),

        React.createElement(

          View,

          {

            style:

              pdfStyles.infoGrid,

          },

          /**

           * CLIENTE

           */

          React.createElement(

            View,

            {

              style:

                pdfStyles.infoColumnLeft,

            },

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Cliente",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              `${data.customer.firstName} ${data.customer.lastName}`,

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "E-mail",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.customer.email ??

                "—",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Téléphone",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.customer.phone ??

                "—",

            ),

          ),

          /**

           * LIVRAISON

           */

          React.createElement(

            View,

            {

              style:

                pdfStyles.infoColumnRight,

            },

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Destinataire",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.delivery.recipientName ??

                `${data.customer.firstName} ${data.customer.lastName}`,

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Téléphone livraison",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.delivery.phone ??

                data.customer.phone ??

                "—",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Pays / Ville",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              [

                data.delivery.country,

                data.delivery.city,

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

                ) ||

                "—",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Adresse",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.delivery.address ??

                "—",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.label,

              },

              "Code postal",

            ),

            React.createElement(

              Text,

              {

                style:

                  pdfStyles.value,

              },

              data.delivery.postalCode ??

                "—",

            ),

          ),

        ),

      ),

      /**

       * ARTICLES

       */

      React.createElement(

        View,

        {

          style:

            pdfStyles.section,

        },

        React.createElement(

          Text,

          {

            style:

              pdfStyles.sectionTitle,

          },

          "Produits",

        ),

        ...itemNodes,

      ),

      /**

       * TOTAUX

       */

      React.createElement(

        View,

        {

          style:

            pdfStyles.totals,

          wrap:

            false,

        },

        React.createElement(

          View,

          {

            style:

              pdfStyles.totalRow,

          },

          React.createElement(

            Text,

            {

              style:

                pdfStyles.totalLabel,

            },

            "Sous-total produits",

          ),

          React.createElement(

            Text,

            null,

            formatReceiptMoney(

              data.productsSubtotal,

            ),

          ),

        ),

        React.createElement(

          View,

          {

            style:

              pdfStyles.totalRow,

          },

          React.createElement(

            Text,

            {

              style:

                pdfStyles.totalLabel,

            },

            "Livraison",

          ),

          React.createElement(

            Text,

            null,

            formatReceiptMoney(

              data.deliveryAmount,

            ),

          ),

        ),

        React.createElement(

          View,

          {

            style:

              pdfStyles.grandTotal,

          },

          React.createElement(

            Text,

            null,

            "Total",

          ),

          React.createElement(

            Text,

            null,

            formatReceiptMoney(

              data.total,

            ),

          ),

        ),

      ),

      /**

       * PAIEMENT

       */

      React.createElement(

        View,

        {

          style:

            pdfStyles.paymentBox,

          wrap:

            false,

        },

        React.createElement(

          View,

          {

            style:

              pdfStyles.paymentRow,

          },

          React.createElement(

            Text,

            {

              style:

                pdfStyles.paymentLabel,

            },

            "Mode de paiement",

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.paymentValue,

            },

            data.payment.label,

          ),

        ),

        React.createElement(

          View,

          {

            style:

              pdfStyles.paymentRow,

          },

          React.createElement(

            Text,

            {

              style:

                pdfStyles.paymentLabel,

            },

            "État",

          ),

          React.createElement(

            Text,

            {

              style:

                pdfStyles.paymentState,

            },

            data.payment.stateLabel,

          ),

        ),

        data.payment.reference

          ? React.createElement(

              View,

              {

                style:

                  pdfStyles.paymentRow,

              },

              React.createElement(

                Text,

                {

                  style:

                    pdfStyles.paymentLabel,

                },

                "Référence paiement",

              ),

              React.createElement(

                Text,

                {

                  style:

                    pdfStyles.paymentValue,

                },

                data.payment.reference,

              ),

            )

          : null,

      ),

      /**

       * FOOTER

       */

      React.createElement(

        Text,

        {

          style:

            pdfStyles.footer,

        },

        `${PUBLIC_SITE.brand.name} • Référence commande : ${data.orderNumber}`,

      ),

    ),

  );

}

/* ==========================================================================

   16. COPIE BYTES

   ========================================================================== */

function copyPdfBytes(

  source: Uint8Array,

): Uint8Array {

  const bytes =

    new Uint8Array(

      source.byteLength,

    );

  bytes.set(

    source,

  );

  return bytes;

}

/* ==========================================================================

   17. RENDER PDF

   ========================================================================== */

export async function renderPublicOrderReceiptPdf(

  rawOrderId: string,

): Promise<RenderedPublicOrderReceipt> {

  const data =

    await loadPublicOrderReceiptData(

      rawOrderId,

    );

  const images =

    await prepareReceiptImages(

      data,

    );

  try {

    const document =

      createPublicOrderReceiptDocument(

        data,

        images,

      ) as Parameters<

        typeof renderToBuffer

      >[0];

    const rendered =

      await renderToBuffer(

        document,

      );

    if (

      !rendered ||

      rendered.byteLength === 0

    ) {

      throw new PublicOrderReceiptError(

        "PDF_EMPTY",

        "Le reçu PDF généré est vide.",

      );

    }

    if (

      rendered.byteLength >

      PUBLIC_ORDER_RECEIPT_MAX_BYTES

    ) {

      throw new PublicOrderReceiptError(

        "PDF_TOO_LARGE",

        "Le reçu PDF généré dépasse la taille maximale autorisée.",

      );

    }

    const bytes =

      copyPdfBytes(

        rendered,

      );

    return {

      bytes,

      mimeType:

        PUBLIC_ORDER_RECEIPT_MIME_TYPE,

      fileName:

        getPublicOrderReceiptFileName(

          data.orderNumber,

        ),

      size:

        bytes.byteLength,

      data,

    };

  } catch (error) {

    if (

      error instanceof

      PublicOrderReceiptError

    ) {

      throw error;

    }

    console.error(

      "[L&E Cosmetics Empire] Échec rendu PDF du reçu public.",

      error,

    );

    throw new PublicOrderReceiptError(

      "PDF_RENDER_FAILED",

      "Impossible de générer le reçu PDF.",

    );

  }

}

/* ==========================================================================

   18. SUPABASE CONFIG

   ========================================================================== */

/**
 * Supabase supporte désormais :
 *
 * - les nouvelles clés serveur sb_secret_... ;
 * - les anciennes clés JWT service_role pendant la migration.
 *
 * Règle :
 *
 * - SUPABASE_SECRET_KEY est prioritaire ;
 * - SUPABASE_SERVICE_ROLE_KEY reste un fallback legacy ;
 * - une clé publishable n'est jamais acceptée pour cet upload serveur.
 */
type PublicReceiptStorageKeyMode =
  | "SECRET_API_KEY"
  | "LEGACY_SERVICE_ROLE";

interface PublicReceiptStorageConfiguration {

  readonly baseUrl: string;

  readonly apiKey: string;

  readonly keyMode:
    PublicReceiptStorageKeyMode;

  readonly bucket: string;

}

function getReceiptStorageConfiguration():

  PublicReceiptStorageConfiguration {

  const baseUrl =

    (

      process.env.SUPABASE_URL ??

      process.env.NEXT_PUBLIC_SUPABASE_URL ??

      ""

    )

      .trim()

      .replace(

        /\/+$/u,

        "",

      );

  const secretKey =

    (

      process.env[

        PUBLIC_ORDER_RECEIPT_SECRET_ENV

      ] ??

      ""

    ).trim();

  const legacyServiceRoleKey =

    (

      process.env[

        PUBLIC_ORDER_RECEIPT_LEGACY_SERVICE_ROLE_ENV

      ] ??

      ""

    ).trim();

  const apiKey =

    secretKey ||

    legacyServiceRoleKey;

  const keyMode:
    PublicReceiptStorageKeyMode =

      secretKey

        ? "SECRET_API_KEY"

        : "LEGACY_SERVICE_ROLE";

  const bucket =

    (

      process.env[

        PUBLIC_ORDER_RECEIPT_STORAGE_ENV

      ] ??

      ""

    ).trim();

  if (

    !baseUrl ||

    !apiKey ||

    !bucket

  ) {

    throw new PublicOrderReceiptError(

      "STORAGE_NOT_CONFIGURED",

      `Le stockage des reçus n’est pas configuré. Vérifiez SUPABASE_URL, ${PUBLIC_ORDER_RECEIPT_SECRET_ENV} ou ${PUBLIC_ORDER_RECEIPT_LEGACY_SERVICE_ROLE_ENV}, ainsi que ${PUBLIC_ORDER_RECEIPT_STORAGE_ENV}.`,

    );

  }

  if (

    apiKey.startsWith(

      "sb_publishable_",

    )

  ) {

    throw new PublicOrderReceiptError(

      "STORAGE_NOT_CONFIGURED",

      "La clé Supabase configurée pour les reçus est une clé publique. Utilisez une clé serveur secrète.",

    );

  }

  if (

    keyMode ===

      "SECRET_API_KEY" &&

    !apiKey.startsWith(

      "sb_secret_",

    )

  ) {

    throw new PublicOrderReceiptError(

      "STORAGE_NOT_CONFIGURED",

      `La variable ${PUBLIC_ORDER_RECEIPT_SECRET_ENV} ne contient pas une clé Supabase serveur valide.`,

    );

  }

  try {

    const url =

      new URL(

        baseUrl,

      );

    const isHttps =

      url.protocol ===

      "https:";

    const isAllowedDevelopmentHttp =

      url.protocol ===

        "http:" &&

      process.env.NODE_ENV !==

        "production";

    if (

      !isHttps &&

      !isAllowedDevelopmentHttp

    ) {

      throw new Error(

        "INVALID_SUPABASE_PROTOCOL",

      );

    }

  } catch {

    throw new PublicOrderReceiptError(

      "STORAGE_NOT_CONFIGURED",

      "La configuration Supabase est invalide.",

    );

  }

  return {

    baseUrl,

    apiKey,

    keyMode,

    bucket,

  };

}

/* ==========================================================================

   19. PATH STORAGE

   ========================================================================== */

function encodeStoragePath(

  path: string,

): string {

  return path

    .split("/")

    .filter(Boolean)

    .map(

      (segment) =>

        encodeURIComponent(

          segment,

        ),

    )

    .join("/");

}

function buildReceiptStoragePath(

  data: PublicOrderReceiptData,

): string {

  /**

   * IMPORTANT :

   *

   * On ne fait PAS encodeURIComponent ici.

   *

   * L'encodage HTTP sera effectué une seule fois par

   * encodeStoragePath() lors de la construction de l'URL.

   *

   * Cela évite le double encodage.

   */

  const safeOrderId =

    sanitizeFileSegment(

      data.orderId,

      "order",

    );

  const fileName =

    getPublicOrderReceiptFileName(

      data.orderNumber,

    );

  return `orders/${safeOrderId}/${fileName}`;

}

/* ==========================================================================

   20. UPLOAD PRIVÉ

   ========================================================================== */

function buildReceiptStorageHeaders(

  configuration:
    PublicReceiptStorageConfiguration,

): Record<string, string> {

  const headers:
    Record<string, string> = {

      apikey:
        configuration.apiKey,

      "Content-Type":
        PUBLIC_ORDER_RECEIPT_MIME_TYPE,

      "x-upsert":
        "true",

    };

  /**
   * Les nouvelles clés sb_secret_... sont des API keys opaques :
   * elles sont envoyées uniquement avec "apikey".
   *
   * Les anciennes service_role sont des JWT legacy.
   * Pour elles, on conserve également Authorization: Bearer afin de ne
   * rien casser pendant la période de migration.
   */
  if (

    configuration.keyMode ===
      "LEGACY_SERVICE_ROLE"

  ) {

    headers.Authorization =
      `Bearer ${configuration.apiKey}`;

  }

  return headers;

}

async function uploadPublicOrderReceiptPdf(

  rendered: RenderedPublicOrderReceipt,

): Promise<

  Readonly<{

    storagePath: string;

    pdfUrl: string;

  }>

> {

  const configuration =

    getReceiptStorageConfiguration();

  const storagePath =

    buildReceiptStoragePath(

      rendered.data,

    );

  const encodedBucket =

    encodeURIComponent(

      configuration.bucket,

    );

  const encodedPath =

    encodeStoragePath(

      storagePath,

    );

  const uploadUrl =

    `${configuration.baseUrl}` +

    `/storage/v1/object/` +

    `${encodedBucket}/` +

    `${encodedPath}`;

  const controller =

    new AbortController();

  const timeout =

    setTimeout(

      () => {

        controller.abort();

      },

      PUBLIC_ORDER_RECEIPT_STORAGE_TIMEOUT_MS,

    );

  let response: Response;

  try {

    response =

      await fetch(

        uploadUrl,

        {

          method:
            "POST",

          cache:
            "no-store",

          signal:
            controller.signal,

          headers:
            buildReceiptStorageHeaders(

              configuration,

            ),

          body:
            Buffer.from(

              rendered.bytes,

            ),

        },

      );

  } catch (error) {

    console.error(

      "[L&E Cosmetics Empire] Erreur réseau pendant l’upload du reçu.",

      {

        orderId:
          rendered.data.orderId,

        receiptId:
          rendered.data.receiptId,

        storagePath,

        error,

      },

    );

    throw new PublicOrderReceiptError(

      "STORAGE_UPLOAD_FAILED",

      "Impossible de stocker le reçu PDF.",

    );

  } finally {

    clearTimeout(

      timeout,

    );

  }

  if (!response.ok) {

    let providerMessage:
      string | null =
        null;

    try {

      const responseText =

        (

          await response.text()

        ).trim();

      if (

        responseText

      ) {

        providerMessage =

          responseText.slice(

            0,

            500,

          );

      }

    } catch {

      providerMessage =
        null;

    }

    console.error(

      "[L&E Cosmetics Empire] Upload Supabase du reçu refusé.",

      {

        status:
          response.status,

        statusText:
          response.statusText,

        storagePath,

        providerMessage,

      },

    );

    throw new PublicOrderReceiptError(

      "STORAGE_UPLOAD_FAILED",

      "Impossible de stocker le reçu PDF.",

    );

  }

  /**
   * URL stable vers l'objet privé.
   *
   * IMPORTANT :
   *
   * Cette URL n'est PAS une URL publique.
   *
   * L'objet reste dans le bucket privé.
   * L'accès devra être réalisé côté serveur ou au moyen
   * d'une URL signée lorsque le téléchargement public
   * contrôlé sera nécessaire.
   */
  const pdfUrl =

    `${configuration.baseUrl}` +

    `/storage/v1/object/authenticated/` +

    `${encodedBucket}/` +

    `${encodedPath}`;

  return {

    storagePath,

    pdfUrl,

  };

}

/* ==========================================================================

   21. GÉNÉRATION + STORAGE + DB

   ========================================================================== */

export async function generateAndStorePublicOrderReceipt(

  orderId: string,

): Promise<GeneratePublicOrderReceiptResult> {

  try {

    const rendered =

      await renderPublicOrderReceiptPdf(

        orderId,

      );

    const stored =

      await uploadPublicOrderReceiptPdf(

        rendered,

      );

    try {

      await db.receipt.update({

        where: {

          id:

            rendered.data.receiptId,

        },

        data: {

          pdfUrl:

            stored.pdfUrl,

        },

      });

    } catch (error) {

      console.error(

        "[L&E Cosmetics Empire] Le PDF a été stocké mais Receipt.pdfUrl n’a pas pu être mis à jour.",

        {

          receiptId:

            rendered.data.receiptId,

          orderId:

            rendered.data.orderId,

          storagePath:

            stored.storagePath,

          error,

        },

      );

      throw new PublicOrderReceiptError(

        "DATABASE_UPDATE_FAILED",

        "Le PDF a été généré mais son URL n’a pas pu être enregistrée.",

      );

    }

    return {

      success:

        true,

      data: {

        ...rendered,

        storagePath:

          stored.storagePath,

        pdfUrl:

          stored.pdfUrl,

      },

    };

  } catch (error) {

    if (

      error instanceof

      PublicOrderReceiptError

    ) {

      return {

        success:

          false,

        code:

          error.code,

        message:

          error.message,

      };

    }

    console.error(

      "[L&E Cosmetics Empire] Échec génération reçu public.",

      error,

    );

    return {

      success:

        false,

      code:

        "SERVER_ERROR",

      message:

        "Impossible de générer le reçu actuellement.",

    };

  }

}

/* ==========================================================================

   22. PDF SEULEMENT

   ========================================================================== */

/**

 * Utile notamment pour public-order-email.ts.

 *

 * Cette fonction retourne directement les bytes du PDF

 * sans obliger l'appelant à recharger lui-même :

 *

 * - la commande ;

 * - le reçu ;

 * - les articles ;

 * - les paiements ;

 * - les images.

 *

 * Elle ne réalise aucun upload Supabase et ne modifie

 * pas Receipt.pdfUrl.

 */

export async function getPublicOrderReceiptAttachment(

  orderId: string,

): Promise<

  Readonly<{

    fileName: string;

    content: Uint8Array;

    contentType:

      typeof PUBLIC_ORDER_RECEIPT_MIME_TYPE;

  }>

> {

  const rendered =

    await renderPublicOrderReceiptPdf(

      orderId,

    );

  return {

    fileName:

      rendered.fileName,

    content:

      rendered.bytes,

    contentType:

      rendered.mimeType,

  };

}