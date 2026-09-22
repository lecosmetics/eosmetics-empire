import {
  db,
} from "../src/prisma/db";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * DIAGNOSTIC — APPARTENANCE COMMANDES / LIVRAISONS / GESTIONNAIRES
 * ============================================================================
 *
 * Ce script ne modifie aucune donnée.
 *
 * Il permet de vérifier pourquoi /gestionnaire/livraisons peut afficher 0
 * alors que des Shipment existent réellement en base.
 *
 * Il affiche :
 *
 * - les boutiques ;
 * - les gestionnaires et leur storeId ;
 * - les commandes et leur storeId ;
 * - les livraisons et leur storeId ;
 * - le storeId réel de l'Order liée à chaque Shipment ;
 * - les incohérences Shipment.storeId !== Order.storeId.
 *
 * ============================================================================
 */


async function main():
  Promise<void> {
  const [
    stores,
    managers,
    orders,
    shipments,
  ] =
    await Promise.all([
      db.store.findMany({
        select: {
          id:
            true,
          name:
            true,
          status:
            true,
        },
        orderBy: {
          createdAt:
            "asc",
        },
      }),

      db.manager.findMany({
        select: {
          id:
            true,
          email:
            true,
          role:
            true,
          status:
            true,
          storeId:
            true,
          store: {
            select: {
              id:
                true,
              name:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            "asc",
        },
      }),

      db.order.findMany({
        select: {
          id:
            true,
          orderNumber:
            true,
          storeId:
            true,
          source:
            true,
          status:
            true,
          customerEmail:
            true,
          createdAt:
            true,
        },
        orderBy: {
          createdAt:
            "desc",
        },
      }),

      db.shipment.findMany({
        select: {
          id:
            true,
          shipmentNumber:
            true,
          storeId:
            true,
          status:
            true,
          createdAt:
            true,
          order: {
            select: {
              id:
                true,
              orderNumber:
                true,
              storeId:
                true,
            },
          },
          store: {
            select: {
              id:
                true,
              name:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            "desc",
        },
      }),
    ]);


  console.log("");
  console.log("============================================================");
  console.log("BOUTIQUES");
  console.log("============================================================");

  if (
    stores.length ===
      0
  ) {
    console.log(
      "Aucune boutique.",
    );
  } else {
    for (
      const store of
      stores
    ) {
      console.log(
        `${store.name} | ${store.id} | ${store.status}`,
      );
    }
  }


  console.log("");
  console.log("============================================================");
  console.log("GESTIONNAIRES");
  console.log("============================================================");

  if (
    managers.length ===
      0
  ) {
    console.log(
      "Aucun gestionnaire.",
    );
  } else {
    for (
      const manager of
      managers
    ) {
      console.log(
        `${manager.email} | role=${manager.role} | status=${manager.status} | store=${manager.store?.name ?? "—"} | storeId=${manager.storeId}`,
      );
    }
  }


  console.log("");
  console.log("============================================================");
  console.log("COMMANDES");
  console.log("============================================================");

  if (
    orders.length ===
      0
  ) {
    console.log(
      "Aucune commande.",
    );
  } else {
    for (
      const order of
      orders
    ) {
      console.log(
        `${order.orderNumber} | source=${order.source} | status=${order.status} | storeId=${order.storeId} | customer=${order.customerEmail ?? "—"}`,
      );
    }
  }


  console.log("");
  console.log("============================================================");
  console.log("LIVRAISONS");
  console.log("============================================================");

  if (
    shipments.length ===
      0
  ) {
    console.log(
      "Aucune livraison.",
    );
  } else {
    for (
      const shipment of
      shipments
    ) {
      const consistent =
        shipment.storeId ===
        shipment.order.storeId;

      console.log(
        `${shipment.shipmentNumber} | status=${shipment.status} | shipment.storeId=${shipment.storeId} | order.storeId=${shipment.order.storeId} | store=${shipment.store?.name ?? "—"} | ownership=${consistent ? "OK" : "INCOHERENT"}`,
      );
    }
  }


  const inconsistentShipments =
    shipments.filter(
      (
        shipment,
      ) =>
        shipment.storeId !==
        shipment.order.storeId,
    );


  console.log("");
  console.log("============================================================");
  console.log("RÉSUMÉ");
  console.log("============================================================");
  console.log(
    `Boutiques : ${stores.length}`,
  );
  console.log(
    `Gestionnaires : ${managers.length}`,
  );
  console.log(
    `Commandes : ${orders.length}`,
  );
  console.log(
    `Livraisons : ${shipments.length}`,
  );
  console.log(
    `Livraisons incohérentes : ${inconsistentShipments.length}`,
  );
}


main()
  .catch(
    (
      error,
    ) => {
      console.error(
        "Échec du diagnostic.",
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
