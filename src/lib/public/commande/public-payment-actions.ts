"use server";

import "server-only";

import {

  randomUUID,

} from "node:crypto";

import {

  safeParsePublicCommandePrepareInput,

} from "@/lib/public/commande/public-commande-schema";

import {

  getPublicCashOnDeliveryOption,

  getPublicPaymentOptions,

  loadPublicPaymentPageFromCheckout,

  validatePublicOnlinePaymentProvider,

} from "@/lib/public/commande/public-payment-query";

import type {

  PublicCommandePrepareInput,

  PublicCommandePreparedCheckout,

} from "@/lib/public/commande/public-commande-types";

import type {

  PublicOnlinePaymentMethod,

  PublicPaymentActionFailureCode,

  PublicPaymentActionResult,

  PublicPaymentOrderReference,

  PublicPaymentPageResult,

  PublicPaymentSelection,

  PublicPaymentSubmitInput,

} from "@/lib/public/commande/public-payment-types";

import {

  db,

} from "@/prisma/db";





/**

 * ============================================================================

 * L&E COSMETICS EMPIRE

 * COMMANDE PUBLIQUE — ACTIONS DE PAIEMENT

 * ============================================================================

 *

 * Fichier :

 *

 * src/lib/public/commande/public-payment-actions.ts

 *

 * ============================================================================

 *

 * RÔLE :

 *

 * Finaliser la commande depuis :

 *

 * /commande/paiement

 *

 * ============================================================================

 *

 * FLUX PAIEMENT À LA LIVRAISON :

 *

 * PublicCommandePrepareInput

 *

 *              ↓

 *

 * revalidation complète du checkout

 *

 *              ↓

 *

 * nouvelle relecture DB DANS la transaction

 *

 *              ↓

 *

 * contrôle final :

 *

 * - StoreProduct ;

 * - Product ;

 * - Store ;

 * - prix ;

 * - devise ;

 * - stock ;

 * - quantité ;

 * - sous-total ;

 * - livraison ;

 * - total.

 *

 *              ↓

 *

 * transaction PostgreSQL
 * timeout borné adapté à une base distante

 *

 *              ↓

 *

 * Customer

 * CustomerAddress

 * Order

 * OrderItem

 * stock

 * StockMovement

 * Shipment

 * Receipt

 *

 *              ↓

 *

 * succès :

 *

 * CASH_ON_DELIVERY

 * TO_PAY

 *

 * ============================================================================

 *

 * IMPORTANT :

 *

 * Pour CASH_ON_DELIVERY :

 *

 * - aucun Payment PAID n'est créé ;

 * - aucun faux débit n'est créé ;

 * - payment reste null dans le résultat public ;

 * - le reçu reste À PAYER.

 *

 * ============================================================================

 *

 * PAIEMENT EN LIGNE :

 *

 * Il reste refusé tant que le vrai provider n'a pas été branché dans

 * l'action d'initialisation.

 *

 * Aucun faux paiement ne sera créé.

 *

 * ============================================================================

 */





/* ==========================================================================

   1. MESSAGES

   ========================================================================== */

const PUBLIC_PAYMENT_ACTION_MESSAGES = {

  invalidInput:

    "Les informations envoyées pour le paiement ne sont pas valides.",

  invalidSelection:

    "Le mode de paiement sélectionné n’est pas valide.",

  emptyPanier:

    "Votre panier est vide.",

  panierChanged:

    "Votre panier a changé. Vérifiez de nouveau votre commande.",

  offerNotFound:

    "Un article de votre panier n’existe plus.",

  offerUnavailable:

    "Un ou plusieurs articles ne sont plus disponibles.",

  outOfStock:

    "Un ou plusieurs articles sont maintenant en rupture de stock.",

  insufficientStock:

    "Le stock disponible n’est plus suffisant pour finaliser cette commande.",

  deliveryUnavailable:

    "Les frais de livraison doivent être vérifiés de nouveau.",

  currencyMismatch:

    "La devise de la commande n’est plus cohérente.",

  totalChanged:

    "Le montant de votre commande a changé. Vérifiez de nouveau votre commande avant de continuer.",

  paymentOptionUnavailable:

    "Ce mode de paiement n’est pas disponible actuellement.",

  paymentProviderUnavailable:

    "Ce fournisseur de paiement n’est pas disponible actuellement.",

  paymentMethodUnavailable:

    "Cette méthode de paiement n’est pas disponible actuellement.",

  orderCreationFailed:

    "La commande n’a pas pu être créée. Réessayez dans quelques instants.",

  onlinePaymentNotImplemented:

    "Le paiement en ligne n’est pas encore disponible pour cette commande.",

  multiStoreUnsupported:

    "Votre panier contient des articles de plusieurs boutiques. La commande doit actuellement être finalisée avec les articles d’une seule boutique à la fois.",

  serverError:

    "Impossible de finaliser la commande actuellement. Réessayez dans quelques instants.",

} as const;

/* ==========================================================================
   2. CONFIGURATION TRANSACTION PRISMA
   ========================================================================== */

/**
 * La transaction interactive réalise plusieurs écritures atomiques sur une
 * base PostgreSQL distante. Le timeout Prisma implicite de 5 secondes est
 * trop court pour ce parcours réel et provoquait P2028.
 *
 * Les valeurs restent volontairement bornées :
 *
 * - maxWait : délai maximum pour obtenir la transaction ;
 * - timeout : durée maximale une fois la transaction ouverte.
 */
const PUBLIC_PAYMENT_TRANSACTION_MAX_WAIT_MS =
  10_000;

const PUBLIC_PAYMENT_TRANSACTION_TIMEOUT_MS =
  30_000;






/* ==========================================================================

   3. ERREUR INTERNE CONTRÔLÉE

   ========================================================================== */

class PublicPaymentActionError extends Error {

  readonly code:

    PublicPaymentActionFailureCode;





  constructor(

    code:

      PublicPaymentActionFailureCode,

    message:

      string,

  ) {

    super(

      message,

    );

    this.name =

      "PublicPaymentActionError";

    this.code =

      code;

  }

}





/* ==========================================================================

   3. RECORD

   ========================================================================== */

type UnknownRecord =

  Record<

    string,

    unknown

  >;





function isUnknownRecord(

  value:

    unknown,

): value is UnknownRecord {

  return (

    typeof value ===

      "object" &&

    value !==

      null &&

    !Array.isArray(

      value,

    )

  );

}





/* ==========================================================================

   4. MÉTHODES ONLINE AUTORISÉES

   ========================================================================== */

const PUBLIC_ONLINE_PAYMENT_METHODS =

  [

    "MOBILE_MONEY",

    "CARD",

    "BANK_TRANSFER",

    "OTHER",

  ] as const satisfies readonly PublicOnlinePaymentMethod[];





function isPublicOnlinePaymentMethod(

  value:

    unknown,

): value is PublicOnlinePaymentMethod {

  return (

    typeof value ===

      "string" &&

    (

      PUBLIC_ONLINE_PAYMENT_METHODS as

        readonly string[]

    ).includes(

      value,

    )

  );

}





/* ==========================================================================

   5. PARSE DE LA SÉLECTION

   ========================================================================== */

function parsePublicPaymentSelection(

  value:

    unknown,

): PublicPaymentSelection | null {

  if (

    !isUnknownRecord(

      value,

    ) ||

    typeof value.mode !==

      "string"

  ) {

    return null;

  }





  if (

    value.mode ===

    "CASH_ON_DELIVERY"

  ) {

    if (

      Object.keys(

        value,

      ).length !==

      1

    ) {

      return null;

    }





    return {

      mode:

        "CASH_ON_DELIVERY",

    };

  }





  if (

    value.mode ===

    "ONLINE"

  ) {

    if (

      typeof value.providerId !==

        "string" ||

      !value.providerId.trim() ||

      !isPublicOnlinePaymentMethod(

        value.method,

      )

    ) {

      return null;

    }





    return {

      mode:

        "ONLINE",

      providerId:

        value.providerId.trim(),

      method:

        value.method,

    };

  }





  return null;

}





/* ==========================================================================

   6. PARSE INPUT ACTION

   ========================================================================== */

function parsePublicPaymentSubmitInput(

  input:

    unknown,

): PublicPaymentSubmitInput | null {

  if (

    !isUnknownRecord(

      input,

    )

  ) {

    return null;

  }





  const checkoutResult =

    safeParsePublicCommandePrepareInput(

      input.checkout,

    );





  if (

    !checkoutResult.success

  ) {

    return null;

  }





  const selection =

    parsePublicPaymentSelection(

      input.selection,

    );





  if (

    selection ===

    null

  ) {

    return null;

  }





  return {

    checkout:

      checkoutResult.data,

    selection,

  };

}





/* ==========================================================================

   7. NORMALISATION DEVISE

   ========================================================================== */

function normalizeCurrency(

  value:

    string,

): string {

  return value

    .trim()

    .toUpperCase();

}





/* ==========================================================================

   8. NORMALISATION MONTANT

   ========================================================================== */

function normalizeMoneyAmount(

  value:

    string,

): string | null {

  const normalized =

    value.trim();





  const match =

    /^(\d+)(?:\.(\d{1,2}))?$/u.exec(

      normalized,

    );





  if (

    !match

  ) {

    return null;

  }





  const integerPart =

    (

      match[

        1

      ] ??

      "0"

    ).replace(

      /^0+(?=\d)/u,

      "",

    );





  const decimalPart =

    (

      match[

        2

      ] ??

      ""

    )

      .padEnd(

        2,

        "0",

      )

      .slice(

        0,

        2,

      );





  return `${integerPart}.${decimalPart}`;

}





/* ==========================================================================

   9. MONTANT → UNITÉS MINEURES

   ========================================================================== */

function moneyToMinorUnitString(

  value:

    string,

): string | null {

  const normalized =

    normalizeMoneyAmount(

      value,

    );





  if (

    normalized ===

    null

  ) {

    return null;

  }





  const parts =

    normalized.split(

      ".",

    );





  const integerPart =

    parts[

      0

    ] ??

    "0";





  const fractionPart =

    parts[

      1

    ] ??

    "00";





  return (

    `${integerPart}${fractionPart}`.replace(

      /^0+(?=\d)/u,

      "",

    ) ||

    "0"

  );

}





/* ==========================================================================

   10. ADDITION STRING EXACTE

   ========================================================================== */

function addUnsignedIntegerStrings(

  left:

    string,

  right:

    string,

): string {

  let leftIndex =

    left.length -

    1;

  let rightIndex =

    right.length -

    1;

  let carry =

    0;

  let result =

    "";





  while (

    leftIndex >=

      0 ||

    rightIndex >=

      0 ||

    carry >

      0

  ) {

    const leftDigit =

      leftIndex >=

      0

        ? left.charCodeAt(

            leftIndex,

          ) -

          48

        : 0;





    const rightDigit =

      rightIndex >=

      0

        ? right.charCodeAt(

            rightIndex,

          ) -

          48

        : 0;





    const sum =

      leftDigit +

      rightDigit +

      carry;





    result =

      `${sum % 10}${result}`;





    carry =

      Math.floor(

        sum /

          10,

      );





    leftIndex -=

      1;

    rightIndex -=

      1;

  }





  return (

    result.replace(

      /^0+(?=\d)/u,

      "",

    ) ||

    "0"

  );

}





/* ==========================================================================

   11. UNITÉS MINEURES → MONTANT

   ========================================================================== */

function minorUnitStringToMoney(

  value:

    string,

): string {

  const normalized =

    value

      .replace(

        /^0+(?=\d)/u,

        "",

      )

      .padStart(

        3,

        "0",

      );





  return `${

    normalized.slice(

      0,

      -2,

    )

  }.${

    normalized.slice(

      -2,

    )

  }`;

}





/* ==========================================================================

   12. ADDITION MONÉTAIRE

   ========================================================================== */

function addMoneyAmounts(

  left:

    string,

  right:

    string,

): string | null {

  const leftMinor =

    moneyToMinorUnitString(

      left,

    );





  const rightMinor =

    moneyToMinorUnitString(

      right,

    );





  if (

    leftMinor ===

      null ||

    rightMinor ===

      null

  ) {

    return null;

  }





  return minorUnitStringToMoney(

    addUnsignedIntegerStrings(

      leftMinor,

      rightMinor,

    ),

  );

}





/* ==========================================================================

   13. COMPARAISON MONTANT

   ========================================================================== */

function moneyAmountsEqual(

  left:

    string,

  right:

    string,

): boolean {

  const normalizedLeft =

    normalizeMoneyAmount(

      left,

    );





  const normalizedRight =

    normalizeMoneyAmount(

      right,

    );





  return (

    normalizedLeft !==

      null &&

    normalizedRight !==

      null &&

    normalizedLeft ===

      normalizedRight

  );

}





/* ==========================================================================

   14. NUMÉROS UNIQUES

   ========================================================================== */

function createOrderNumber():

  string {

  return `LE-${Date.now()}-${randomUUID()

    .replace(

      /-/gu,

      "",

    )

    .slice(

      0,

      10,

    )

    .toUpperCase()}`;

}





function createReceiptNumber():

  string {

  return `REC-${Date.now()}-${randomUUID()

    .replace(

      /-/gu,

      "",

    )

    .slice(

      0,

      10,

    )

    .toUpperCase()}`;

}





/**
 * Une commande publique crée actuellement une seule livraison.
 *
 * La référence est dérivée du numéro de commande réel afin d'être :
 *
 * - stable ;
 * - lisible ;
 * - unique puisque Order.orderNumber est unique ;
 * - réutilisable pour le backfill des anciennes commandes.
 *
 * Aucun compteur fictif n'est fabriqué dans l'interface.
 */
function createShipmentNumber(

  orderNumber:

    string,

): string {

  return `LIV-${orderNumber}`;

}





/* ==========================================================================

   15. ADRESSE COMPLÈTE

   ========================================================================== */

function buildFullShippingAddress(

  checkout:

    PublicCommandePreparedCheckout,

): string {

  const address =

    checkout.address.address.trim();





  const complement =

    checkout.address.addressComplement?.trim() ??

    "";





  if (

    !complement

  ) {

    return address;

  }





  return `${address}, ${complement}`;

}





/* ==========================================================================

   16. NOM COMPLET

   ========================================================================== */

function buildRecipientName(

  checkout:

    PublicCommandePreparedCheckout,

): string {

  return `${checkout.customer.firstName} ${checkout.customer.lastName}`

    .trim();

}





/* ==========================================================================

   17. MAPPING ERREUR QUERY → ACTION

   ========================================================================== */

function mapPaymentPageFailure(

  result:

    Extract<

      PublicPaymentPageResult,

      {

        readonly success:

          false;

      }

    >,

): PublicPaymentActionError {

  switch (

    result.code

  ) {

    case "INVALID_INPUT":

      return new PublicPaymentActionError(

        "INVALID_INPUT",

        result.message,

      );





    case "EMPTY_PANIER":

      return new PublicPaymentActionError(

        "EMPTY_PANIER",

        result.message,

      );





    case "PANIER_CHANGED":

      return new PublicPaymentActionError(

        "PANIER_CHANGED",

        result.message,

      );





    case "OFFER_UNAVAILABLE":

      return new PublicPaymentActionError(

        "OFFER_UNAVAILABLE",

        result.message,

      );





    case "INSUFFICIENT_STOCK":

      return new PublicPaymentActionError(

        "INSUFFICIENT_STOCK",

        result.message,

      );





    case "DELIVERY_UNAVAILABLE":

      return new PublicPaymentActionError(

        "DELIVERY_UNAVAILABLE",

        result.message,

      );





    case "CURRENCY_MISMATCH":

      return new PublicPaymentActionError(

        "CURRENCY_MISMATCH",

        result.message,

      );





    case "NO_PAYMENT_OPTION":

      return new PublicPaymentActionError(

        "PAYMENT_OPTION_UNAVAILABLE",

        result.message,

      );





    case "CHECKOUT_INVALID":

      return new PublicPaymentActionError(

        "TOTAL_CHANGED",

        result.message,

      );





    case "SERVER_ERROR":

    default:

      return new PublicPaymentActionError(

        "SERVER_ERROR",

        PUBLIC_PAYMENT_ACTION_MESSAGES.serverError,

      );

  }

}





/* ==========================================================================

   18. CHECKOUT MONO-BOUTIQUE

   ========================================================================== */

/**

 * Le modèle Order actuel contient un seul storeId.

 *

 * On ne fabrique donc pas silencieusement une stratégie split-order.

 */

function getSingleStoreId(

  checkout:

    PublicCommandePreparedCheckout,

): string {

  if (

    checkout.snapshot.storeIds.length !==

      1

  ) {

    throw new PublicPaymentActionError(

      "INVALID_INPUT",

      PUBLIC_PAYMENT_ACTION_MESSAGES.multiStoreUnsupported,

    );

  }





  const storeId =

    checkout.snapshot.storeIds[

      0

    ];





  if (

    !storeId

  ) {

    throw new PublicPaymentActionError(

      "INVALID_INPUT",

      PUBLIC_PAYMENT_ACTION_MESSAGES.multiStoreUnsupported,

    );

  }





  return storeId;

}





/* ==========================================================================

   19. DEVISE UNIQUE

   ========================================================================== */

function getSingleCurrency(

  checkout:

    PublicCommandePreparedCheckout,

): string {

  if (

    checkout.snapshot.currencies.length !==

      1

  ) {

    throw new PublicPaymentActionError(

      "CURRENCY_MISMATCH",

      PUBLIC_PAYMENT_ACTION_MESSAGES.currencyMismatch,

    );

  }





  const currency =

    checkout.snapshot.currencies[

      0

    ];





  if (

    !currency

  ) {

    throw new PublicPaymentActionError(

      "CURRENCY_MISMATCH",

      PUBLIC_PAYMENT_ACTION_MESSAGES.currencyMismatch,

    );

  }





  return normalizeCurrency(

    currency,

  );

}





/* ==========================================================================

   20. TOTAL CHECKOUT OBLIGATOIRE

   ========================================================================== */

function assertCheckoutSummary(

  checkout:

    PublicCommandePreparedCheckout,

) {

  const productsSubtotal =

    checkout.summary.productsSubtotal;





  const delivery =

    checkout.summary.delivery;





  const total =

    checkout.summary.total;





  if (

    productsSubtotal ===

      null ||

    delivery ===

      null ||

    total ===

      null

  ) {

    throw new PublicPaymentActionError(

      "TOTAL_CHANGED",

      PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

    );

  }





  return {

    productsSubtotal,

    delivery,

    total,

  };

}





/* ==========================================================================

   21. CRÉATION / RÉUTILISATION CUSTOMER

   ========================================================================== */

async function getOrCreateCustomer(

  transaction:

    Parameters<

      Parameters<

        typeof db.$transaction

      >[

        0

      ]

    >[

      0

    ],

  checkout:

    PublicCommandePreparedCheckout,

  storeId:

    string,

): Promise<string> {

  const email =

    checkout.customer.email.trim();





  const phone =

    checkout.customer.phone.trim();





  let customer =

    await transaction.customer.findFirst({

      where: {

        storeId,

        email,

      },

      select: {

        id:

          true,

      },

      orderBy: {

        createdAt:

          "asc",

      },

    });





  if (

    customer ===

    null &&

    phone

  ) {

    customer =

      await transaction.customer.findFirst({

        where: {

          storeId,

          phone,

        },

        select: {

          id:

            true,

        },

        orderBy: {

          createdAt:

            "asc",

        },

      });

  }





  if (

    customer

  ) {

    await transaction.customer.update({

      where: {

        id:

          customer.id,

      },

      data: {

        firstName:

          checkout.customer.firstName,

        lastName:

          checkout.customer.lastName,

        email,

        phone,

      },

    });





    return customer.id;

  }





  const created =

    await transaction.customer.create({

      data: {

        storeId,

        firstName:

          checkout.customer.firstName,

        lastName:

          checkout.customer.lastName,

        email,

        phone,

      },

      select: {

        id:

          true,

      },

    });





  return created.id;

}





/* ==========================================================================

   22. ADRESSE CUSTOMER

   ========================================================================== */

async function ensureCustomerAddress(

  transaction:

    Parameters<

      Parameters<

        typeof db.$transaction

      >[

        0

      ]

    >[

      0

    ],

  checkout:

    PublicCommandePreparedCheckout,

  customerId:

    string,

): Promise<void> {

  const fullAddress =

    buildFullShippingAddress(

      checkout,

    );





  const existing =

    await transaction.customerAddress.findFirst({

      where: {

        customerId,

        country:

          checkout.address.countryName,

        city:

          checkout.address.city,

        address:

          fullAddress,

        postalCode:

          checkout.address.postalCode,

      },

      select: {

        id:

          true,

      },

    });





  if (

    existing

  ) {

    return;

  }





  const addressCount =

    await transaction.customerAddress.count({

      where: {

        customerId,

      },

    });





  await transaction.customerAddress.create({

    data: {

      customerId,

      type:

        "SHIPPING",

      label:

        null,

      recipientName:

        buildRecipientName(

          checkout,

        ),

      phone:

        checkout.customer.phone,

      country:

        checkout.address.countryName,

      city:

        checkout.address.city,

      address:

        fullAddress,

      postalCode:

        checkout.address.postalCode,

      isDefault:

        addressCount ===

        0,

    },

  });

}





/* ==========================================================================

   23. CRÉATION CASH ON DELIVERY

   ========================================================================== */

async function createCashOnDeliveryOrder(

  checkout:

    PublicCommandePreparedCheckout,

): Promise<PublicPaymentOrderReference> {

  const storeId =

    getSingleStoreId(

      checkout,

    );





  const currency =

    getSingleCurrency(

      checkout,

    );





  const summary =

    assertCheckoutSummary(

      checkout,

    );





  if (

    normalizeCurrency(

      summary.productsSubtotal.currency,

    ) !==

      currency ||

    normalizeCurrency(

      summary.delivery.currency,

    ) !==

      currency ||

    normalizeCurrency(

      summary.total.currency,

    ) !==

      currency

  ) {

    throw new PublicPaymentActionError(

      "CURRENCY_MISMATCH",

      PUBLIC_PAYMENT_ACTION_MESSAGES.currencyMismatch,

    );

  }





  const orderNumber =

    createOrderNumber();





  const receiptNumber =

    createReceiptNumber();





  const shipmentNumber =

    createShipmentNumber(

      orderNumber,

    );





  return db.$transaction(

    async (

      transaction,

    ) => {

      /* =====================================================================

         1. RELECTURE FINALE DB

         ===================================================================== */

      const checkoutItems =

        checkout.snapshot.items;





      const storeProductIds =

        checkoutItems.map(

          (

            item,

          ) =>

            item.storeProductId,

        );





      const rows =

        await transaction.storeProduct.findMany({

          where: {

            id: {

              in:

                storeProductIds,

            },

          },

          select: {

            id:

              true,

            storeId:

              true,

            price:

              true,

            currency:

              true,

            stockQuantity:

              true,

            status:

              true,

            product: {

              select: {

                name:

                  true,

                sku:

                  true,

                status:

                  true,

              },

            },

            store: {

              select: {

                status:

                  true,

              },

            },

          },

        });





      if (

        rows.length !==

        checkoutItems.length

      ) {

        throw new PublicPaymentActionError(

          "OFFER_NOT_FOUND",

          PUBLIC_PAYMENT_ACTION_MESSAGES.offerNotFound,

        );

      }





      const rowById =

        new Map(

          rows.map(

            (

              row,

            ) => [

              row.id,

              row,

            ] as const,

          ),

        );





      /* =====================================================================

         2. REVALIDATION DES LIGNES + SOUS-TOTAL RÉEL

         ===================================================================== */

      let actualProductsSubtotal =

        "0.00";





      const orderItems:

        Array<{

          readonly storeProductId:

            string;

          readonly productName:

            string;

          readonly sku:

            string | null;

          readonly quantity:

            number;

          readonly unitPrice:

            string;

          readonly totalPrice:

            string;

        }> =

          [];





      for (

        const item of

        checkoutItems

      ) {

        const row =

          rowById.get(

            item.storeProductId,

          );





        if (

          !row

        ) {

          throw new PublicPaymentActionError(

            "OFFER_NOT_FOUND",

            PUBLIC_PAYMENT_ACTION_MESSAGES.offerNotFound,

          );

        }





        if (

          row.storeId !==

            storeId

        ) {

          throw new PublicPaymentActionError(

            "PANIER_CHANGED",

            PUBLIC_PAYMENT_ACTION_MESSAGES.panierChanged,

          );

        }





        if (

          row.store.status !==

            "ACTIVE" ||

          row.product.status !==

            "ACTIVE" ||

          row.status !==

            "ACTIVE"

        ) {

          throw new PublicPaymentActionError(

            "OFFER_UNAVAILABLE",

            PUBLIC_PAYMENT_ACTION_MESSAGES.offerUnavailable,

          );

        }





        if (

          row.stockQuantity <=

          0

        ) {

          throw new PublicPaymentActionError(

            "OUT_OF_STOCK",

            PUBLIC_PAYMENT_ACTION_MESSAGES.outOfStock,

          );

        }





        if (

          row.stockQuantity <

          item.quantity

        ) {

          throw new PublicPaymentActionError(

            "INSUFFICIENT_STOCK",

            PUBLIC_PAYMENT_ACTION_MESSAGES.insufficientStock,

          );

        }





        const rowCurrency =

          normalizeCurrency(

            row.currency,

          );





        if (

          rowCurrency !==

            currency

        ) {

          throw new PublicPaymentActionError(

            "CURRENCY_MISMATCH",

            PUBLIC_PAYMENT_ACTION_MESSAGES.currencyMismatch,

          );

        }





        const actualUnitPrice =

          row.price.toFixed(

            2,

          );





        const expectedUnitPrice =

          normalizeMoneyAmount(

            item.unitPrice.amount,

          );





        if (

          expectedUnitPrice ===

            null ||

          !moneyAmountsEqual(

            actualUnitPrice,

            expectedUnitPrice,

          )

        ) {

          throw new PublicPaymentActionError(

            "TOTAL_CHANGED",

            PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

          );

        }





        const actualLineTotal =

          row.price

            .mul(

              item.quantity,

            )

            .toFixed(

              2,

            );





        const expectedLineTotal =

          normalizeMoneyAmount(

            item.subtotal.amount,

          );





        if (

          expectedLineTotal ===

            null ||

          !moneyAmountsEqual(

            actualLineTotal,

            expectedLineTotal,

          )

        ) {

          throw new PublicPaymentActionError(

            "TOTAL_CHANGED",

            PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

          );

        }





        const nextSubtotal =

          addMoneyAmounts(

            actualProductsSubtotal,

            actualLineTotal,

          );





        if (

          nextSubtotal ===

          null

        ) {

          throw new PublicPaymentActionError(

            "TOTAL_CHANGED",

            PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

          );

        }





        actualProductsSubtotal =

          nextSubtotal;





        orderItems.push({

          storeProductId:

            row.id,

          productName:

            row.product.name,

          sku:

            row.product.sku,

          quantity:

            item.quantity,

          unitPrice:

            actualUnitPrice,

          totalPrice:

            actualLineTotal,

        });

      }





      /* =====================================================================

         3. SOUS-TOTAL

         ===================================================================== */

      if (

        !moneyAmountsEqual(

          actualProductsSubtotal,

          summary.productsSubtotal.amount,

        )

      ) {

        throw new PublicPaymentActionError(

          "TOTAL_CHANGED",

          PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

        );

      }





      /* =====================================================================

         4. TOTAL

         ===================================================================== */

      const shippingAmount =

        normalizeMoneyAmount(

          summary.delivery.amount,

        );





      if (

        shippingAmount ===

        null

      ) {

        throw new PublicPaymentActionError(

          "DELIVERY_UNAVAILABLE",

          PUBLIC_PAYMENT_ACTION_MESSAGES.deliveryUnavailable,

        );

      }





      const actualTotal =

        addMoneyAmounts(

          actualProductsSubtotal,

          shippingAmount,

        );





      if (

        actualTotal ===

          null ||

        !moneyAmountsEqual(

          actualTotal,

          summary.total.amount,

        )

      ) {

        throw new PublicPaymentActionError(

          "TOTAL_CHANGED",

          PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

        );

      }





      /* =====================================================================

         5. CUSTOMER

         ===================================================================== */

      const customerId =

        await getOrCreateCustomer(

          transaction,

          checkout,

          storeId,

        );





      await ensureCustomerAddress(

        transaction,

        checkout,

        customerId,

      );





      /* =====================================================================

         6. ORDER

         ===================================================================== */

      const createdOrder =

        await transaction.order.create({

          data: {

            orderNumber,

            storeId,

            customerId,

            source:

              "WEBSITE",

            status:

              "PENDING",

            customerFirstName:

              checkout.customer.firstName,

            customerLastName:

              checkout.customer.lastName,

            customerEmail:

              checkout.customer.email,

            customerPhone:

              checkout.customer.phone,

            shippingRecipientName:

              buildRecipientName(

                checkout,

              ),

            shippingPhone:

              checkout.customer.phone,

            shippingCountry:

              checkout.address.countryName,

            shippingCity:

              checkout.address.city,

            shippingAddress:

              buildFullShippingAddress(

                checkout,

              ),

            shippingPostalCode:

              checkout.address.postalCode,

            currency,

            subtotal:

              actualProductsSubtotal,

            discountAmount:

              "0.00",

            shippingAmount,

            taxAmount:

              "0.00",

            totalAmount:

              actualTotal,

            notes:

              null,

            items: {

              create:

                orderItems.map(

                  (

                    item,

                  ) => ({

                    storeProductId:

                      item.storeProductId,

                    productName:

                      item.productName,

                    sku:

                      item.sku,

                    quantity:

                      item.quantity,

                    unitPrice:

                      item.unitPrice,

                    totalPrice:

                      item.totalPrice,

                  }),

                ),

            },

          },

          select: {

            id:

              true,

            orderNumber:

              true,

            storeId:

              true,

            currency:

              true,

            totalAmount:

              true,

          },

        });





      /* =====================================================================

         7. DÉCRÉMENT ATOMIQUE DU STOCK

         ===================================================================== */

      for (

        const item of

        checkoutItems

      ) {

        const stockUpdate =

          await transaction.storeProduct.updateMany({

            where: {

              id:

                item.storeProductId,

              storeId,

              status:

                "ACTIVE",

              stockQuantity: {

                gte:

                  item.quantity,

              },

            },

            data: {

              stockQuantity: {

                decrement:

                  item.quantity,

              },

            },

          });





        if (

          stockUpdate.count !==

          1

        ) {

          throw new PublicPaymentActionError(

            "INSUFFICIENT_STOCK",

            PUBLIC_PAYMENT_ACTION_MESSAGES.insufficientStock,

          );

        }





        const updatedStock =

          await transaction.storeProduct.findUnique({

            where: {

              id:

                item.storeProductId,

            },

            select: {

              stockQuantity:

                true,

            },

          });





        if (

          updatedStock ===

          null

        ) {

          throw new PublicPaymentActionError(

            "OFFER_NOT_FOUND",

            PUBLIC_PAYMENT_ACTION_MESSAGES.offerNotFound,

          );

        }





        const quantityAfter =

          updatedStock.stockQuantity;





        const quantityBefore =

          quantityAfter +

          item.quantity;





        await transaction.stockMovement.create({

          data: {

            storeId,

            storeProductId:

              item.storeProductId,

            managerId:

              null,

            type:

              "SALE",

            quantity:

              item.quantity,

            quantityBefore,

            quantityAfter,

            reason:

              "Commande publique",

            reference:

              createdOrder.orderNumber,

          },

        });





        if (

          quantityAfter ===

          0

        ) {

          await transaction.storeProduct.update({

            where: {

              id:

                item.storeProductId,

            },

            data: {

              status:

                "OUT_OF_STOCK",

            },

          });

        }

      }





      /* =====================================================================

         8. SHIPMENT

         ===================================================================== */

      /**
       * Toute commande publique réellement validée possède immédiatement
       * une ligne Shipment réelle.
       *
       * Le module Gestionnaire /livraisons lit la table Shipment :
       * sans cette création, une Order pouvait exister sans jamais apparaître
       * dans l'écran de gestion des livraisons.
       *
       * Le statut initial reste PENDING :
       * aucun transporteur, tracking ou expédition n'est inventé ici.
       */
      await transaction.shipment.create({

        data: {

          shipmentNumber,

          orderId:

            createdOrder.id,

          storeId:

            createdOrder.storeId,

          status:

            "PENDING",

          carrier:

            null,

          trackingNumber:

            null,

          trackingUrl:

            null,

          recipientName:

            buildRecipientName(

              checkout,

            ),

          phone:

            checkout.customer.phone,

          country:

            checkout.address.countryName,

          city:

            checkout.address.city,

          address:

            buildFullShippingAddress(

              checkout,

            ),

          postalCode:

            checkout.address.postalCode,

          shippingCost:

            shippingAmount,

          currency:

            createdOrder.currency,

          shippedAt:

            null,

          deliveredAt:

            null,

        },

      });





      /* =====================================================================

         9. RECEIPT

         ===================================================================== */

      /**

       * Le reçu métier existe dès la création réelle de la commande.

       *

       * pdfUrl reste null jusqu'à ce que :

       *

       * public-order-receipt.ts

       *

       * génère et stocke le PDF.

       */

      await transaction.receipt.create({

        data: {

          receiptNumber,

          orderId:

            createdOrder.id,

          storeId:

            createdOrder.storeId,

          status:

            "ISSUED",

          currency:

            createdOrder.currency,

          amount:

            createdOrder.totalAmount,

          pdfUrl:

            null,

          emailedAt:

            null,

        },

      });





      /* =====================================================================

         10. RÉFÉRENCE PUBLIQUE

         ===================================================================== */

      return {

        id:

          createdOrder.id,

        orderNumber:

          createdOrder.orderNumber,

        storeId:

          createdOrder.storeId,

        currency:

          createdOrder.currency,

        total: {

          amount:

            createdOrder.totalAmount.toFixed(

              2,

            ),

          currency:

            createdOrder.currency,

        },

      };

    },

    {
      maxWait:
        PUBLIC_PAYMENT_TRANSACTION_MAX_WAIT_MS,

      timeout:
        PUBLIC_PAYMENT_TRANSACTION_TIMEOUT_MS,
    },

  );

}





/* ==========================================================================

   24. VALIDATION OPTION

   ========================================================================== */

function assertPaymentSelectionAvailable(

  checkout:

    PublicCommandePreparedCheckout,

  selection:

    PublicPaymentSelection,

): void {

  const options =

    getPublicPaymentOptions(

      checkout,

    );





  if (

    selection.mode ===

    "CASH_ON_DELIVERY"

  ) {

    const cashOption =

      getPublicCashOnDeliveryOption(

        options,

      );





    if (

      cashOption ===

        null ||

      !cashOption.available

    ) {

      throw new PublicPaymentActionError(

        "PAYMENT_OPTION_UNAVAILABLE",

        cashOption?.unavailableReason ??

        PUBLIC_PAYMENT_ACTION_MESSAGES.paymentOptionUnavailable,

      );

    }





    return;

  }





  const total =

    checkout.summary.total;





  if (

    total ===

    null

  ) {

    throw new PublicPaymentActionError(

      "TOTAL_CHANGED",

      PUBLIC_PAYMENT_ACTION_MESSAGES.totalChanged,

    );

  }





  const providerResult =

    validatePublicOnlinePaymentProvider({

      options,

      providerId:

        selection.providerId,

      method:

        selection.method,

      currency:

        total.currency,

    });





  if (

    !providerResult.success

  ) {

    switch (

      providerResult.code

    ) {

      case "METHOD_NOT_SUPPORTED":

        throw new PublicPaymentActionError(

          "PAYMENT_METHOD_UNAVAILABLE",

          providerResult.message,

        );





      case "PROVIDER_NOT_FOUND":

      case "PROVIDER_DISABLED":

      case "CURRENCY_NOT_SUPPORTED":

      default:

        throw new PublicPaymentActionError(

          "PAYMENT_PROVIDER_UNAVAILABLE",

          providerResult.message,

        );

    }

  }

}





/* ==========================================================================

   25. ACTION PRINCIPALE

   ========================================================================== */

export async function submitPublicPaymentAction(

  input:

    unknown,

): Promise<PublicPaymentActionResult> {

  try {

    /* =======================================================================

       1. VALIDATION INPUT

       ======================================================================= */

    const parsedInput =

      parsePublicPaymentSubmitInput(

        input,

      );





    if (

      parsedInput ===

      null

    ) {

      return {

        success:

          false,

        code:

          "INVALID_INPUT",

        message:

          PUBLIC_PAYMENT_ACTION_MESSAGES.invalidInput,

      };

    }





    /* =======================================================================

       2. REVALIDATION SERVEUR COMPLÈTE

       ======================================================================= */

    const paymentPageResult =

      await loadPublicPaymentPageFromCheckout(

        parsedInput.checkout,

      );





    if (

      !paymentPageResult.success

    ) {

      throw mapPaymentPageFailure(

        paymentPageResult,

      );

    }





    const checkout =

      paymentPageResult.data.checkout;





    /* =======================================================================

       3. OPTION TOUJOURS DISPONIBLE ?

       ======================================================================= */

    assertPaymentSelectionAvailable(

      checkout,

      parsedInput.selection,

    );





    /* =======================================================================

       4. CASH ON DELIVERY

       ======================================================================= */

    if (

      parsedInput.selection.mode ===

      "CASH_ON_DELIVERY"

    ) {

      const order =

        await createCashOnDeliveryOrder(

          checkout,

        );





      return {

        success:

          true,

        data: {

          mode:

            "CASH_ON_DELIVERY",

          customerState:

            "TO_PAY",

          receiptState:

            "TO_PAY",

          orders: [

            order,

          ],

          /**

           * Aucun faux Payment PAID.

           *

           * Le paiement sera réalisé à la livraison.

           */

          payment:

            null,

        },

      };

    }





    /* =======================================================================

       5. ONLINE

       ======================================================================= */

    /**

     * Même si un provider venait à apparaître dans la configuration,

     * on refuse de créer une fausse transaction tant que son intégration

     * réelle :

     *

     * - API ;

     * - retour provider ;

     * - webhook ;

     * - signature ;

     * - confirmation serveur

     *

     * n'est pas branchée ici.

     */

    return {

      success:

        false,

      code:

        "PAYMENT_INITIALIZATION_FAILED",

      message:

        PUBLIC_PAYMENT_ACTION_MESSAGES.onlinePaymentNotImplemented,

    };

  } catch (

    error

  ) {

    if (

      error instanceof

      PublicPaymentActionError

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

      "[L&E Cosmetics Empire] Échec de finalisation du paiement public.",

      error,

    );





    return {

      success:

        false,

      code:

        "SERVER_ERROR",

      message:

        PUBLIC_PAYMENT_ACTION_MESSAGES.serverError,

    };

  }

}





/* ==========================================================================

   26. ACTION TYPÉE

   ========================================================================== */

/**

 * Helper pour les composants qui possèdent déjà le contrat TypeScript.

 *

 * La validation runtime reste effectuée par submitPublicPaymentAction().

 */

export async function submitTypedPublicPaymentAction(

  input:

    PublicPaymentSubmitInput,

): Promise<PublicPaymentActionResult> {

  return submitPublicPaymentAction(

    input,

  );

}





/* ==========================================================================

   27. ACTION CASH ON DELIVERY DÉDIÉE

   ========================================================================== */

/**

 * Helper pratique pour l'interface.

 *

 * Il évite au composant de construire lui-même un objet selection.

 */

export async function submitPublicCashOnDeliveryAction(

  checkout:

    PublicCommandePrepareInput,

): Promise<PublicPaymentActionResult> {

  return submitPublicPaymentAction({

    checkout,

    selection: {

      mode:

        "CASH_ON_DELIVERY",

    },

  });

}





/* ==========================================================================

   28. DOCUMENTATION

   ========================================================================== */

/**

 * ============================================================================

 *

 * /COMMANDE/PAIEMENT

 *

 * cliente choisit :

 *

 * PAIEMENT À LA LIVRAISON

 *

 *              ↓

 *

 * submitPublicPaymentAction()

 *

 *              ↓

 *

 * validation runtime

 *

 *              ↓

 *

 * loadPublicPaymentPageFromCheckout()

 *

 *              ↓

 *

 * revalidation :

 *

 * prix

 * stocks

 * boutiques

 * devises

 * livraison

 * total

 *

 *              ↓

 *

 * transaction DB

 *

 *              ↓

 *

 * Customer

 *

 *              ↓

 *

 * CustomerAddress

 *

 *              ↓

 *

 * Order = PENDING

 *

 *              ↓

 *

 * OrderItem[]

 *

 *              ↓

 *

 * stockQuantity diminué

 *

 *              ↓

 *

 * StockMovement SALE

 *

 *              ↓

 *

 * Shipment PENDING

 *

 *              ↓

 *

 * Receipt ISSUED

 *

 * pdfUrl = null pour le moment

 *

 *              ↓

 *

 * résultat :

 *

 * CASH_ON_DELIVERY

 *

 * customerState = TO_PAY

 *

 * receiptState = TO_PAY

 *

 * payment = null

 *

 * ============================================================================

 *

 * À aucun moment :

 *

 * Payment.status = PAID

 *

 * n'est créé pour le paiement à la livraison.

 *

 * ============================================================================

 */