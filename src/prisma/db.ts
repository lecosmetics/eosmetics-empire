import "server-only";

import {
  PrismaClient,
} from "@prisma/client";

import {
  PrismaPg,
} from "@prisma/adapter-pg";


/* ============================================================
   L&E COSMETICS EMPIRE
   PRISMA DATABASE CLIENT
   ------------------------------------------------------------
   Fichier :
   src/prisma/db.ts

   Stack :
   - Next.js
   - Prisma ORM 7.10.0
   - @prisma/client
   - @prisma/adapter-pg
   - PostgreSQL / Supabase

   Ce fichier est exclusivement serveur.
   ============================================================ */


/* ============================================================
   DATABASE CONNECTION
   ------------------------------------------------------------
   DATABASE_URL :
   connexion utilisée par l'application en fonctionnement.

   DIRECT_URL :
   réservée aux commandes Prisma CLI / migrations via
   prisma7.config.ts.

   Aucun secret n'est écrit directement dans le code.
   ============================================================ */

const connectionString =
  process.env.DATABASE_URL?.trim();


if (!connectionString) {
  throw new Error(
    "DATABASE_URL doit être définie dans les variables d'environnement.",
  );
}


/* ============================================================
   POSTGRESQL ADAPTER
   ------------------------------------------------------------
   Prisma 7 utilise ici le driver PostgreSQL officiel via
   @prisma/adapter-pg.
   ============================================================ */

const adapter =
  new PrismaPg({
    connectionString,
  });


/* ============================================================
   GLOBAL PRISMA CACHE
   ------------------------------------------------------------
   En développement, Next.js recharge fréquemment les modules.

   Sans singleton, plusieurs instances de PrismaClient peuvent
   être créées pendant le hot reload.
   ============================================================ */

const globalForPrisma =
  globalThis as typeof globalThis & {
    __cosmeticsEmpirePrisma?:
      PrismaClient;
  };


/* ============================================================
   PRISMA CLIENT
   ============================================================ */

export const db =
  globalForPrisma.__cosmeticsEmpirePrisma ??
  new PrismaClient({
    adapter,

    log:
      process.env.NODE_ENV ===
      "development"
        ? [
            "warn",
            "error",
          ]
        : [
            "error",
          ],
  });


/* ============================================================
   DEVELOPMENT SINGLETON
   ------------------------------------------------------------
   On conserve l'instance uniquement hors production.

   En production, le cycle de vie de l'application gère
   naturellement l'instance du client.
   ============================================================ */

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForPrisma.__cosmeticsEmpirePrisma =
    db;
}


/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default db;