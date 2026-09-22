import {
  db,
} from "../src/prisma/db";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * BACKFILL — COMMANDES SANS LIVRAISON
 * ============================================================================
 *
 * Crée un Shipment réel pour chaque Order existante qui :
 *
 * - ne possède encore aucune livraison ;
 * - possède les données minimales de livraison nécessaires.
 *
 * Le script est réexécutable.
 * Il ne fabrique jamais une adresse, un transporteur ou un tracking.
 * ============================================================================
 */


function createShipmentNumber(
  orderNumber: string,
): string {
  return `LIV-${orderNumber}`;
}


function normalizeOptionalText(
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


function getShipmentStatusFromOrder({
  status,
  deliveredAt,
}: {
  readonly status:
    string;

  readonly deliveredAt:
    Date | null;
}):
  | "PENDING"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED" {
  switch (
    status
  ) {
    case "PROCESSING":
    case "READY":
      return "PREPARING";

    case "SHIPPED":
      return "SHIPPED";

    case "DELIVERED":
      return "DELIVERED";

    case "CANCELLED":
      return "CANCELLED";

    case "REFUNDED":
      return deliveredAt
        ? "RETURNED"
        : "CANCELLED";

    case "PENDING":
    case "CONFIRMED":
    default:
      return "PENDING";
  }
}


async function main():
  Promise<void> {
  const orders =
    await db.order.findMany({
      where: {
        shipments: {
          none: {},
        },
      },

      select: {
        id:
          true,

        orderNumber:
          true,

        storeId:
          true,

        status:
          true,

        customerFirstName:
          true,

        customerLastName:
          true,

        customerPhone:
          true,

        shippingRecipientName:
          true,

        shippingPhone:
          true,

        shippingCountry:
          true,

        shippingCity:
          true,

        shippingAddress:
          true,

        shippingPostalCode:
          true,

        shippingAmount:
          true,

        currency:
          true,

        deliveredAt:
          true,

        createdAt:
          true,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });


  let createdCount =
    0;

  let skippedCount =
    0;

  let alreadyPresentCount =
    0;


  for (
    const order of
    orders
  ) {
    const recipientName =
      normalizeOptionalText(
        order.shippingRecipientName,
      ) ??
      `${order.customerFirstName} ${order.customerLastName}`.trim();

    const phone =
      normalizeOptionalText(
        order.shippingPhone,
      ) ??
      normalizeOptionalText(
        order.customerPhone,
      );

    const country =
      normalizeOptionalText(
        order.shippingCountry,
      );

    const city =
      normalizeOptionalText(
        order.shippingCity,
      );

    const address =
      normalizeOptionalText(
        order.shippingAddress,
      );

    const postalCode =
      normalizeOptionalText(
        order.shippingPostalCode,
      );


    if (
      !recipientName ||
      !country ||
      !city ||
      !address
    ) {
      skippedCount +=
        1;

      console.warn(
        `[SKIP] ${order.orderNumber} : données de livraison obligatoires absentes.`,
      );

      continue;
    }


    const shipmentNumber =
      createShipmentNumber(
        order.orderNumber,
      );


    const existingByNumber =
      await db.shipment.findUnique({
        where: {
          shipmentNumber,
        },

        select: {
          id:
            true,

          orderId:
            true,
        },
      });


    if (
      existingByNumber
    ) {
      if (
        existingByNumber.orderId !==
          order.id
      ) {
        throw new Error(
          `Collision de référence livraison : ${shipmentNumber}.`,
        );
      }

      alreadyPresentCount +=
        1;

      continue;
    }


    const status =
      getShipmentStatusFromOrder({
        status:
          order.status,

        deliveredAt:
          order.deliveredAt,
      });


    await db.shipment.create({
      data: {
        shipmentNumber,

        orderId:
          order.id,

        storeId:
          order.storeId,

        status,

        carrier:
          null,

        trackingNumber:
          null,

        trackingUrl:
          null,

        recipientName,

        phone,

        country,

        city,

        address,

        postalCode,

        shippingCost:
          order.shippingAmount,

        currency:
          order.currency,

        shippedAt:
          null,

        deliveredAt:
          status ===
            "DELIVERED"
            ? order.deliveredAt
            : null,
      },
    });


    createdCount +=
      1;

    console.log(
      `[OK] ${order.orderNumber} -> ${shipmentNumber}`,
    );
  }


  console.log("");
  console.log("Backfill livraisons terminé.");
  console.log(`Créées : ${createdCount}`);
  console.log(`Déjà présentes : ${alreadyPresentCount}`);
  console.log(`Ignorées (adresse incomplète) : ${skippedCount}`);
}


main()
  .catch(
    (
      error,
    ) => {
      console.error(
        "Échec du backfill des livraisons.",
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await db.$disconnect();
    },
  );
