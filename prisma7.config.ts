import "dotenv/config";

import {
  defineConfig,
} from "prisma/config";


const databaseUrl =
  process.env["DIRECT_URL"]?.trim() ||
  process.env["DATABASE_URL"]?.trim();


if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL ou DATABASE_URL doit être défini dans le fichier .env.",
  );
}


export default defineConfig({
  schema:
    "prisma/schema.prisma",

  migrations: {
    path:
      "prisma/migrations",
  },

  datasource: {
    url:
      databaseUrl,
  },
});