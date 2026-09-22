import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";


/* ============================================================
   L&E COSMETICS EMPIRE
   ESLINT CONFIGURATION
   ------------------------------------------------------------
   Stack :
   - Next.js 16
   - React 19
   - TypeScript
   - Prisma ORM 7.10.0
   - PostgreSQL / Supabase

   OBJECTIF :

   - analyser tout le vrai code de l'application ;
   - exclure les fichiers générés automatiquement ;
   - exclure les anciens artefacts Prisma 8 ;
   - exclure les outils externes présents dans le projet ;
   - exclure les caches et sorties de compilation ;
   - conserver un lint strict sur le code métier.

   IMPORTANT :

   Les dossiers suivants restent analysés :

   src/app/**
   src/components/**
   src/config/**
   src/lib/**
   src/server/**
   src/prisma/db.ts

   ============================================================ */


const eslintConfig =
  defineConfig([
    /* ========================================================
       NEXT.JS — CORE WEB VITALS
       ======================================================== */

    ...nextVitals,


    /* ========================================================
       TYPESCRIPT
       ======================================================== */

    ...nextTs,


    /* ========================================================
       GLOBAL IGNORES
       ======================================================== */

    globalIgnores([
      /* ======================================================
         NEXT.JS
         ====================================================== */

      ".next/**",
      "out/**",
      "build/**",
      "dist/**",

      "next-env.d.ts",


      /* ======================================================
         NODE / DEPENDENCIES
         ====================================================== */

      "node_modules/**",


      /* ======================================================
         TEST / COVERAGE / TEMP
         ====================================================== */

      "coverage/**",
      ".coverage/**",

      "tmp/**",
      "temp/**",

      ".tmp/**",
      ".temp/**",


      /* ======================================================
         CACHE
         ====================================================== */

      ".cache/**",
      ".turbo/**",

      "*.tsbuildinfo",
      "tsconfig.tsbuildinfo",


      /* ======================================================
         EDITOR / AI TOOLS / LOCAL SKILLS
         ------------------------------------------------------
         Ces dossiers peuvent contenir du TypeScript appartenant
         aux outils externes et non à Cosmetics Empire.
         ====================================================== */

      ".cursor/**",
      ".devin/**",
      ".claude/**",
      ".agents/**",


      /* ======================================================
         GIT / IDE
         ====================================================== */

      ".git/**",

      ".idea/**",

      ".vscode/**",


      /* ======================================================
         ANCIEN PRISMA 8
         ------------------------------------------------------
         Anciennes migrations / système ORM Prisma 8.
         Prisma 7 utilise désormais prisma/migrations.
         ====================================================== */

      "migrations/**",

      ".prisma8-backup/**",


      /* ======================================================
         ANCIEN CODE GÉNÉRÉ PRISMA
         ------------------------------------------------------
         Le client Prisma 7 actuel est généré dans :

         node_modules/@prisma/client

         src/generated n'est donc pas du code métier actuel.
         ====================================================== */

      "src/generated/**",


      /* ======================================================
         ANCIENS CONTRATS PRISMA 8
         ====================================================== */

      "src/prisma/contract.d.ts",
      "src/prisma/contract*.d.ts",

      "src/prisma/contract.ts",
      "src/prisma/contract*.ts",

      "src/prisma/contract.json",
      "src/prisma/contract*.json",

      "src/prisma/contract.prisma",
      "src/prisma/contract*.prisma",


      /* ======================================================
         PRISMA 7 MIGRATIONS
         ------------------------------------------------------
         Les migrations SQL sont générées par Prisma et ne font
         pas partie du code TypeScript métier à lint.
         ====================================================== */

      "prisma/migrations/**",


      /* ======================================================
         GENERATED DATABASE FILES
         ====================================================== */

      "prisma/generated/**",

      ".prisma/**",


      /* ======================================================
         LOGS
         ====================================================== */

      "*.log",

      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "pnpm-debug.log*",


      /* ======================================================
         LOCAL ENV FILES
         ------------------------------------------------------
         ESLint ne doit pas analyser les fichiers d'environnement.
         ====================================================== */

      ".env",
      ".env.*",


      /* ======================================================
         SYSTEM FILES
         ====================================================== */

      ".DS_Store",

      "Thumbs.db",
    ]),
  ]);


export default eslintConfig;