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

   Le code métier de Cosmetics Empire reste entièrement linté.

   Seuls sont ignorés :
   - fichiers générés ;
   - caches ;
   - dépendances ;
   - outils externes ;
   - anciens artefacts Prisma 8 ;
   - migrations générées.
   ============================================================ */


const eslintConfig =
  defineConfig([
    /* ========================================================
       NEXT.JS
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
      /* ------------------------------------------------------
         NEXT.JS
         ------------------------------------------------------ */

      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",

      "**/next-env.d.ts",


      /* ------------------------------------------------------
         NODE / DEPENDENCIES
         ------------------------------------------------------ */

      "**/node_modules/**",


      /* ------------------------------------------------------
         CACHE / TEMP
         ------------------------------------------------------ */

      "**/.cache/**",
      "**/.turbo/**",

      "**/coverage/**",
      "**/.coverage/**",

      "**/tmp/**",
      "**/temp/**",
      "**/.tmp/**",
      "**/.temp/**",

      "**/*.tsbuildinfo",


      /* ------------------------------------------------------
         OUTILS EXTERNES / AGENTS / SKILLS
         ------------------------------------------------------
         Ces fichiers n'appartiennent pas au code applicatif
         Cosmetics Empire.
         ------------------------------------------------------ */

      "**/.cursor/**",
      "**/.claude/**",
      "**/.devin/**",
      "**/.agents/**",


      /* ------------------------------------------------------
         IDE / VERSION CONTROL
         ------------------------------------------------------ */

      "**/.git/**",
      "**/.idea/**",
      "**/.vscode/**",


      /* ------------------------------------------------------
         ANCIEN SYSTÈME PRISMA 8
         ------------------------------------------------------ */

      "**/.prisma8-backup/**",

      "migrations/**",


      /* ------------------------------------------------------
         ANCIEN CODE PRISMA GÉNÉRÉ
         ------------------------------------------------------ */

      "src/generated/**",


      /* ------------------------------------------------------
         ANCIENS CONTRATS PRISMA 8
         ------------------------------------------------------ */

      "src/prisma/contract.d.ts",
      "src/prisma/contract*.d.ts",

      "src/prisma/contract.ts",
      "src/prisma/contract*.ts",

      "src/prisma/contract.json",
      "src/prisma/contract*.json",

      "src/prisma/contract.prisma",
      "src/prisma/contract*.prisma",


      /* ------------------------------------------------------
         MIGRATIONS PRISMA 7
         ------------------------------------------------------ */

      "prisma/migrations/**",


      /* ------------------------------------------------------
         AUTRES FICHIERS GÉNÉRÉS PRISMA
         ------------------------------------------------------ */

      "**/.prisma/**",
      "prisma/generated/**",


      /* ------------------------------------------------------
         LOGS
         ------------------------------------------------------ */

      "**/*.log",

      "**/npm-debug.log*",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/pnpm-debug.log*",


      /* ------------------------------------------------------
         ENVIRONNEMENT
         ------------------------------------------------------ */

      "**/.env",
      "**/.env.*",


      /* ------------------------------------------------------
         FICHIERS SYSTÈME
         ------------------------------------------------------ */

      "**/.DS_Store",
      "**/Thumbs.db",
    ]),
  ]);


export default eslintConfig;