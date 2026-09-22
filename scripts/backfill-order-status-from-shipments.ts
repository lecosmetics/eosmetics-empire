import {
  OrderStatus,
} from "@prisma/client";

import {
  db,
} from "../src/prisma/db";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * BACKFILL — ORDER STATUS DEPUIS SHIPMENTS
 * ============================================================================
 *
 * Répare les commandes déjà existantes créées avant la synchronisation
 * transactionnelle Shipment -> Order.
 *
 * - aucun Payment n'est modifié ;
 * - aucune livraison n'est créée ;
 * - tous les Shipment réels de la commande sont utilisés ;
 * - REFUNDED / DELIVERED / CANCELLED restent terminaux.
 * ============================================================================
 */


function getLatestDeliveredAt(
  shipments:
    readonly {
      readonly deliveredAt:
        Date | null;
    }[],
): Date | null {
  let latest:
    Date | null =
      null;


  for (
    const shipment of
    shipments
  ) {
    if (
      !shipment.deliveredAt
    ) {
      continue;
    }


    if (
      latest ===
        null ||
      shipment.deliveredAt.getTime() >
        latest.getTime()
    ) {
      latest =
        shipment.deliveredAt;
    }
  }


  return latest;
}


async function main():
  Promise<void> {
  const orders =
    await db.order.findMany({
      where: {
        shipments: {
          some: {},
        },
      },

      select: {
        id:
          true,

        orderNumber:
          true,

        status:
          true,

        confirmedAt:
          true,

        cancelledAt:
          true,

        deliveredAt:
          true,

        shipments: {
          select: {
            status:
              true,

            deliveredAt:
              true,
          },
        },
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });


  let updated =
    0;

  let unchanged =
    0;


  for (
    const order of
    orders
  ) {
    if (
      order.status ===
        OrderStatus.REFUNDED ||
      order.status ===
        OrderStatus.DELIVERED ||
      order.status ===
        OrderStatus.CANCELLED
    ) {
      unchanged +=
        1;

      continue;
    }


    const shipments =
      order.shipments;


    const allDelivered =
      shipments.length >
        0 &&
      shipments.every(
        (
          shipment,
        ) =>
          shipment.status ===
          "DELIVERED",
      );


    const allCancelled =
      shipments.length >
        0 &&
      shipments.every(
        (
          shipment,
        ) =>
          shipment.status ===
          "CANCELLED",
      );


    const hasStartedShipping =
      shipments.some(
        (
          shipment,
        ) =>
          shipment.status ===
            "SHIPPED" ||
          shipment.status ===
            "IN_TRANSIT" ||
          shipment.status ===
            "DELIVERED",
      );


    const hasPreparing =
      shipments.some(
        (
          shipment,
        ) =>
          shipment.status ===
          "PREPARING",
      );


    const now =
      new Date();


    if (
      allDelivered
    ) {
      const deliveredAt =
        getLatestDeliveredAt(
          shipments,
        ) ??
        now;


      await db.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          status:
            OrderStatus.DELIVERED,

          confirmedAt:
            order.confirmedAt ??
            deliveredAt,

          cancelledAt:
            null,

          deliveredAt,
        },
      });


      updated +=
        1;

      console.log(
        `[OK] ${order.orderNumber} -> DELIVERED`,
      );

      continue;
    }


    if (
      allCancelled
    ) {
      await db.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          status:
            OrderStatus.CANCELLED,

          cancelledAt:
            order.cancelledAt ??
            now,

          deliveredAt:
            null,
        },
      });


      updated +=
        1;

      console.log(
        `[OK] ${order.orderNumber} -> CANCELLED`,
      );

      continue;
    }


    if (
      hasStartedShipping
    ) {
      await db.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          status:
            OrderStatus.SHIPPED,

          confirmedAt:
            order.confirmedAt ??
            now,

          cancelledAt:
            null,

          deliveredAt:
            null,
        },
      });


      updated +=
        1;

      console.log(
        `[OK] ${order.orderNumber} -> SHIPPED`,
      );

      continue;
    }


    if (
      hasPreparing
    ) {
      await db.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          status:
            OrderStatus.PROCESSING,

          confirmedAt:
            order.confirmedAt ??
            now,

          cancelledAt:
            null,

          deliveredAt:
            null,
        },
      });


      updated +=
        1;

      console.log(
        `[OK] ${order.orderNumber} -> PROCESSING`,
      );

      continue;
    }


    unchanged +=
      1;
  }


  console.log("");
  console.log("Backfill Order <- Shipment terminé.");
  console.log(`Commandes synchronisées : ${updated}`);
  console.log(`Commandes inchangées : ${unchanged}`);
}


main()
  .catch(
    (
      error,
    ) => {
      console.error(
        "Échec du backfill Order <- Shipment.",
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
